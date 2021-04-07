## Standard Version

定制化版本标准化工具（依赖 [standard-version](https://github.com/conventional-changelog/standard-version#readme)）

### 能力

1.  标准化 tag 脚本；
2.  自动生成 changelog；
3.  分支检查（只能在特定分支上使用）；
4.  自动同步 tag 和修改到远程;
5.  自动发布。

### 快速开始

#### 安装

```sh
    # npm
    npm i hjy-sv -D
    # yarn
    yarn add hjy-sv -D

```

#### 使用

```sh
# 简单使用

    # npm
    npm sv

    # yarn
    yarn sv

# 更多例子（yarn为例)

    # 自动推送到远程仓库
    yarn sv -p

    # 忽略分支检查
    yarn sv -i

    # 配置合法分支名
    yarn sv config set legalBranch <branchName>

    # 自动发布到npm
    yarn sv --publish

    # 帮助
    yarn sv -h

```

除了命令行调用，更推荐配置 npm script 进行使用。

### 分支检查

- 默认只能在`release`分支上使用；
- 可以通过命令`yarn sv config set legalBranch <branchName>`进行配置，**branchName 支持正则**；
- 参数`-i`可以忽略分支检查，`yarn sv -i`。

### 配置文件

可在项目根目录下创建`.svrc`或`.svrc.json`文件，对脚本进行配置。

#### 配置项

- ignore`<Boolean>`
  > 是否忽略分支检查
- push`<Boolean>`
  > 是否推送到远程
- publish`<Boolean>`
  > 是否发布到 npm
- legalBranch`<String>`
  > 合法分支 **支持正则**
