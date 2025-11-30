// postcss.config.js
export default {
  plugins: {
    // 核心修复：根据构建日志中的错误，使用这个包名
    '@tailwindcss/postcss': {},
    // 保持 Autoprefixer 不变
    autoprefixer: {},
  },
}