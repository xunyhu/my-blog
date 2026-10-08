---
title: 'HTTPS原理'
description: '理解 TLS 1.3 握手、证书链、密钥协商与 AEAD，并划清 0-RTT 重放边界，建立 HTTPS 工程排障方法。'
updatedAt: '2026-10-02'
module: '浏览器与网络'
order: 4
status: 'done'
---

# HTTPS原理

## 一、是什么

HTTPS 是通过安全传输承载 HTTP 的方式，核心目标是机密性、完整性和对端身份认证。
对于常见的 HTTP/1.1、HTTP/2，TLS 位于 HTTP 与 TCP 之间；HTTP/3 则把 TLS 握手集成进 QUIC。

“证书”“密钥协商”“对称加密”负责不同任务：

- 证书把域名身份与公钥绑定，信任依赖证书链和客户端的信任策略。
- 密钥协商让双方导出共享秘密，而不是把最终业务密钥明文传递给对方。
- 对称认证加密保护后续数据，既防窃听，也检测未经授权的修改。

SSL 是历史名称，不应作为新系统应启用的协议建议。
本文以 [RFC 8446 TLS 1.3](https://www.rfc-editor.org/rfc/rfc8446.html) 为依据，不沿用旧式 RSA 密钥交换叙事。

## 二、为什么

明文连接上的攻击者可能读取 Cookie、替换脚本或修改接口响应。
单纯加密却不验证对端身份，仍可能把秘密交给冒充服务器的人。

| 保护目标         | 对应机制               | 保护不到的事情         |
| ---------------- | ---------------------- | ---------------------- |
| 不被旁路读取正文 | 会话流量密钥与加密     | 终端感染恶意软件       |
| 数据不被静默修改 | AEAD 认证标签          | 应用自己生成的错误数据 |
| 确认服务器身份   | 证书链与握手签名       | 网站经营者是否可信     |
| 限制历史流量泄漏 | 临时密钥交换的前向保密 | 已在端点泄漏的明文     |

TLS 不替代鉴权、CSRF 防护、输入校验和日志脱敏。
CDN 终止 TLS 后能够看到 HTTP 明文，因此也属于需要审计的信任边界。

## 三、核心原理

### TLS 1.3 完整握手

下面展示常见的证书认证加临时密钥交换路径，省略客户端证书认证等可选分支。
TCP 已建立；TLS 本身通常需要一个往返后，客户端才能发送普通应用数据。
HelloRetryRequest、网络重传等情况会增加等待，不能把“一次 RTT”当作所有连接的承诺。

```text
客户端                                         服务器
  | -- ClientHello ----------------------------> |
  |    supported_versions / key_share / ALPN      |
  | <----------------------------- ServerHello -- |
  |                              选择版本和密钥份额 |
  |                                              |
  | 双方根据临时密钥交换结果派生握手流量密钥          |
  |                                              |
  | <--- {EncryptedExtensions} ----------------- |
  | <--- {Certificate + CertificateVerify} ------ |
  | <--- {Finished} ---------------------------- |
  |                                              |
  | 验证证书链、域名、签名和握手完整性               |
  | -- {Finished} -----------------------------> |
  | <======== 应用流量密钥保护的 HTTP 数据 ========> |
```

大括号表示握手密钥保护的消息。
ServerHello 之后的大部分握手内容已加密，不是整个握手都明文可见。

- `key_share` 提供临时密钥交换材料，常见实现使用椭圆曲线 Diffie-Hellman。
- `CertificateVerify` 使用证书对应私钥对握手上下文签名，证明持有私钥。
- `Finished` 验证握手转录完整性与密钥一致性。
- HKDF 派生出不同用途、不同方向的密钥，避免直接拿共享秘密加密一切。
- 应用记录由 AES-GCM、ChaCha20-Poly1305 等 AEAD 算法保护。

TLS 1.3 移除了旧式 RSA 密钥传输。
“客户端随机生成会话密钥，再用证书公钥加密发送”不是 TLS 1.3 的标准完整握手流程。

### 证书链如何建立信任

```text
本机信任库中的根 CA
        | 验证签发关系
        v
中间 CA 证书
        | 验证签发关系
        v
站点叶子证书 -- SAN 匹配 URL 中的主机名
        |
        +-- 握手签名证明服务器持有对应私钥
```

服务器通常发送叶子证书及所需中间证书，根证书由客户端预先信任。
客户端需要检查有效期、签名链、用途、约束以及主机名是否匹配 SAN。
吊销检查、证书透明度等还受浏览器和平台策略影响，不能用“每次必查 OCSP”概括所有实现。

SNI 帮助服务器选择虚拟主机证书，ALPN 用于协商应用协议，两者不能混用。
加密连接并不意味着所有元数据都隐藏：IP 地址、连接时间和流量大小通常仍可见。

### 会话恢复与 0-RTT 重放边界

会话恢复可以使用先前握手得到的 PSK 信息。
只有双方支持并接受早期数据时，客户端才可能随 ClientHello 发送 0-RTT 数据；首次陌生连接不能凭空获得这个条件。
普通会话恢复也不等于一定启用 0-RTT。

```text
正常客户端 -- ClientHello + 早期请求 --> 边缘节点 A --> 业务处理
                    |
攻击者复制密文 ------+----------------> 边缘节点 B --> 可能再次处理

攻击者不必解密，也可能造成重复业务效果
```

[RFC 8446 第 2.3 节](https://www.rfc-editor.org/rfc/rfc8446.html#section-2.3) 明确指出：早期数据不具备跨连接的不可重放保证，也不具备与临时密钥交换普通数据相同的前向保密属性。

工程策略应按资源审查，而不只是按请求方法审查：

1. 对下单、转账、登录状态变更等敏感操作禁用早期处理。
2. GET 若实际触发计费、发券或一次性操作，也不能因名字叫 GET 就放行。
3. CDN 与源站需要传递并正确处理 `Early-Data: 1`，不能在中间链路丢失风险标记。
4. 不接受风险时，在 TLS 层拒绝早期数据、延后处理，或按 RFC 返回 `425 Too Early`。
5. 对因 425 重试的请求，不应再次使用早期数据；这不是无限重试授权。
6. 业务幂等、票据去重和跨节点状态管理是额外防线，不应宣称从此绝对不可重放。

这些 HTTP 层处理规则见 [RFC 8470](https://www.rfc-editor.org/rfc/rfc8470.html)。
浏览器 fetch 不提供通用的“强制这一条用 0-RTT”参数，应在 TLS 终止层配置并验证。

## 四、代码实现

### 在内存中验证密钥协商与完整性保护

保存为 `tls-primitives.mjs`，使用 Node.js 22+ 执行 `node tls-primitives.mjs`。
只使用内置 `node:crypto`，不读取证书文件，不访问外部 API，也不启动服务器。

这不是 TLS 实现，而是拆开验证“双方独立得到同一秘密”和“密文篡改被拒绝”两个构件。
生产环境应交给成熟 TLS 库，不能照此自制传输协议。

```js
import assert from 'node:assert/strict';
import {
  generateKeyPairSync,
  diffieHellman,
  hkdfSync,
  randomBytes,
  createCipheriv,
  createDecipheriv,
} from 'node:crypto';

const client = generateKeyPairSync('x25519');
const server = generateKeyPairSync('x25519');
const left = diffieHellman({
  privateKey: client.privateKey,
  publicKey: server.publicKey,
});
const right = diffieHellman({
  privateKey: server.privateKey,
  publicKey: client.publicKey,
});
assert.deepEqual(left, right);

const salt = randomBytes(32);
const info = Buffer.from('demo client to server key');
const clientKey = Buffer.from(hkdfSync('sha256', left, salt, info, 32));
const serverKey = Buffer.from(hkdfSync('sha256', right, salt, info, 32));
assert.deepEqual(clientKey, serverKey);

// 仅加密一条记录；真实协议必须保证同一密钥下 nonce 不重复。
const nonce = randomBytes(12);
const aad = Buffer.from('demo-record-1');
const cipher = createCipheriv('aes-256-gcm', clientKey, nonce);
cipher.setAAD(aad);
const ciphertext = Buffer.concat([
  cipher.update('hello HTTPS', 'utf8'),
  cipher.final(),
]);
const tag = cipher.getAuthTag();

function decrypt(bytes) {
  const decipher = createDecipheriv('aes-256-gcm', serverKey, nonce);
  decipher.setAAD(aad);
  decipher.setAuthTag(tag);
  // final 校验成功前，不向业务交付中间明文。
  return Buffer.concat([decipher.update(bytes), decipher.final()]);
}

assert.equal(decrypt(ciphertext).toString(), 'hello HTTPS');
const damaged = Buffer.from(ciphertext);
damaged[0] ^= 1;
assert.throws(() => decrypt(damaged));
console.log('Shared secret, derived key and tamper rejection: passed');
```

示例没有认证交换来的公钥，所以独立运行的密钥协商仍可能遭受中间人攻击。
TLS 正是通过证书认证与握手转录绑定，把这些构件连接成完整协议。

## 五、工程实践

### 按层定位握手失败

| 现象                 | 要取得的证据                   | 优先检查                           |
| -------------------- | ------------------------------ | ---------------------------------- |
| 证书域名错误         | 浏览器 Security 面板中的 SAN   | SNI、CDN 域名绑定、访问地址        |
| 部分设备不信任       | 失败设备的证书链与信任库       | 中间证书是否缺失、根 CA 兼容性     |
| 证书尚未生效或过期   | 客户端时间、有效期             | 自动续期、时钟同步                 |
| 协议或密码套件不匹配 | TLS 终止层握手日志             | 客户端能力与服务端最低版本         |
| TLS 正常但接口 502   | CDN 与回源日志                 | 后端连接，不要误判成浏览器证书问题 |
| 只有早期请求异常     | 0-RTT 接受率、425、重复业务 ID | 边缘与源站的早期数据策略           |

不要用关闭证书校验来“修复”线上问题，也不要把忽略错误后的成功当成验收通过。
应保留原始失败信息，分别验证浏览器到 CDN、CDN 到源站的 TLS 配置。

### 安全上线清单

- 在证书过期前预警，并实际演练自动续期与证书链部署。
- 对 HTTP 跳转 HTTPS 做回归，再逐步启用 HSTS。
- `includeSubDomains`、预加载属于扩大影响范围的承诺，确认所有子域可用后再评估。
- HTTPS 页面中的脚本、接口与 WebSocket 也应使用安全地址，避免混合内容。
- 网关信任的早期数据标记必须来自受控链路，源站不能无条件相信任意客户端自报的代理状态。

### 常见误区

- **证书公钥负责加密所有 HTTP 正文**：正文使用派生的对称流量密钥。
- **TLS 1.3 就是零往返**：完整握手、恢复握手和早期数据是不同路径。
- **加密意味着不能重放**：复制合法早期密文不需要知道明文。
- **有 HTTPS 就不会泄漏账号信息**：XSS、错误授权、共享缓存和日志仍能泄漏数据。

## 六、总结

HTTPS 的可信性来自身份验证、密钥协商、握手完整性和记录保护的组合。
性能优化必须以安全边界为前提，尤其不能用 0-RTT 的低延迟换取未评估的重复业务执行。

### 延伸阅读

- [RFC 8446 第 8 节](https://www.rfc-editor.org/rfc/rfc8446.html#section-8)：0-RTT 与抗重放设计。
- [RFC 8470](https://www.rfc-editor.org/rfc/rfc8470.html)：Early-Data 与 425 的协作语义。
- [HTTP协议](/knowledge/03-浏览器与网络/03-HTTP协议)：HTTP/3 如何使用 QUIC。
- [TCP三次握手](/knowledge/03-浏览器与网络/05-TCP三次握手)：区分 TCP 建连与 TLS 握手。
