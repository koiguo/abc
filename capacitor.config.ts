import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ionic.test',
  appName: 'test',
  webDir: 'www',
  
server: {
    // Android 使用 http 协议
    androidScheme: 'http',
    // iOS 使用 http 协议
    iosScheme: 'http',
    // 允许明文传输（解决 HTTP 请求被阻止的问题）
    cleartext: true,
  },
  
  // ✅ Android 特定配置
  android: {
    // 允许混合内容（HTTP 和 HTTPS 混合）
    allowMixedContent: true,
  },
  
};


export default config;
