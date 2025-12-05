# make-apk.ps1 — 一键构建 APK + 签名（并可选上传）
# 使用前提：Docker 已安装并能运行；项目根目录包含 package.json、h5pack.json
# 执行: .\make-apk.ps1

Set-StrictMode -Off

$CurrentDir = (Get-Location).Path
$dockerfile = Join-Path $CurrentDir "Dockerfile.apk"
$keystoreConfig = Join-Path $CurrentDir "keystore-config.json"

# 如果 Dockerfile.apk 不存在，生成（与之前内容相同）
@"
FROM eclipse-temurin:8-jdk

RUN apt-get update && apt-get install -y \
    curl git unzip wget nodejs npm ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g yarn

ENV ANDROID_SDK_ROOT=/sdk
RUN mkdir -p /sdk && cd /sdk && \
    wget https://dl.google.com/android/repository/commandlinetools-linux-6858069_latest.zip -O tools.zip && \
    unzip tools.zip && \
    mkdir -p /sdk/cmdline-tools && mv cmdline-tools /sdk/cmdline-tools/latest

ENV PATH="${PATH}:/sdk/cmdline-tools/latest/bin:/sdk/platform-tools"

# accept licenses (may be interactive; some sdkmanager versions accept yes)
RUN yes | sdkmanager --licenses || true

RUN sdkmanager --sdk_root=/sdk "platform-tools" "platforms;android-30" "build-tools;30.0.3"

WORKDIR /app
COPY . .
RUN npm install

CMD ["npm", "run", "compress"]
"@ | Out-File -Encoding UTF8 $dockerfile

Write-Host "生成 Dockerfile.apk 完成" -ForegroundColor Green

# Build Docker image
$imgName = "h5pack-apk"
Write-Host "开始构建 Docker 镜像 $imgName (可能较慢) ..." -ForegroundColor Cyan
docker build -f $dockerfile -t $imgName .

if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker 镜像构建失败。请检查日志。" -ForegroundColor Red
    exit 1
}

Write-Host "镜像构建成功: $imgName" -ForegroundColor Green

# Run container to build APK (this runs npm run compress inside image)
Write-Host "开始在容器中执行打包 (npm run compress) ..." -ForegroundColor Cyan
docker run --rm -v "$CurrentDir:/app" $imgName

if ($LASTEXITCODE -ne 0) {
    Write-Host "容器内构建 APK 失败，请查看上方日志。" -ForegroundColor Red
    exit 2
}

Write-Host "容器内构建 APK 完成，开始签名步骤..." -ForegroundColor Green

# Ensure keystore-config present
if (-not (Test-Path $keystoreConfig)) {
    # create default keystore-config.json using your password
    $default = @{
        keystoreFile = "keystore.jks";
        alias = "navkey";
        storePass = "milk18841###";
        keyPass = "milk18841###";
        dname = "CN=navapp, OU=dev, O=your-org, L=City, S=Province, C=CN";
        validityDays = 10000
    } | ConvertTo-Json -Depth 5
    $default | Out-File -Encoding UTF8 $keystoreConfig
    Write-Host "已生成默认 keystore-config.json（你可以编辑此文件修改 alias/dname 等）" -ForegroundColor Yellow
}

# Run signing script
Write-Host "调用 sign-apk.ps1 开始签名..." -ForegroundColor Cyan
.\sign-apk.ps1

if ($LASTEXITCODE -ne 0) {
    Write-Host "签名失败，请查看日志。" -ForegroundColor Red
    exit 3
}

Write-Host "==== 打包并签名完成 ====" -ForegroundColor Green
Write-Host "最终签名 APK 位于: $CurrentDir\apk  （文件名带 -signed）" -ForegroundColor Yellow

# OPTIONAL: 自动上传到 GitHub Releases
# 如果你想自动上传，请设置以下环境变量后取消注释下面的块并执行：
# $env:GITHUB_TOKEN = "<你的 token>"
# $env:GITHUB_REPO = "用户名/仓库名"
# $env:GITHUB_TAG = "v1.0.0"
#
# 上传示例（需要 gh/或直接用 curl 调用 Releases API）：
# if ($env:GITHUB_TOKEN -and $env:GITHUB_REPO -and $env:GITHUB_TAG) {
#     Write-Host "准备上传到 GitHub Releases $env:GITHUB_REPO 标签 $env:GITHUB_TAG" -ForegroundColor Cyan
#     # 这里可以用 gh cli 或 curl 调用 API 创建 release 并上传 artifact
# }
