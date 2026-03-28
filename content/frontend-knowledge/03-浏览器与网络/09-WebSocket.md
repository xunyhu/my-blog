# WebSocket

## 一、是什么

WebSocket 是一种全双工通信协议。

## 二、特点

- 长连接
- 实时通信
- 低延迟

## 三、对比 HTTP

|      | HTTP   | WebSocket |
| ---- | ------ | --------- |
| 连接 | 短连接 | 长连接    |
| 通信 | 单向   | 双向      |

## 四、使用场景

- 聊天
- 实时通知
- 游戏

## 五、示例

```js
const ws = new WebSocket('ws://localhost:3000');

ws.onmessage = (msg) => {
  console.log(msg.data);
};
```
