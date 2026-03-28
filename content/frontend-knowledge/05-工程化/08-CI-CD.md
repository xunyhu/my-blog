# CI-CD

## 一、是什么

CI/CD 是自动化构建、测试、部署流程。

## 二、流程

提交代码 → 构建 → 测试 → 部署

## 三、CI（持续集成）

- 自动测试
- 自动构建

## 四、CD（持续部署）

- 自动发布
- 自动上线

## 五、常见工具

- GitHub Actions
- Jenkins
- GitLab CI

## 六、示例

```yaml
name: build

on: push

jobs:
  build:
    runs-on: ubuntu-latest
```

## 七、总结

CI/CD本质：

自动化软件交付流程
