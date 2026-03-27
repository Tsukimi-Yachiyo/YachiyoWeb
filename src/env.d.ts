/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, any>
  export default component
}

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  // 更多环境变量可以在这里添加
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  captchaText: string
}

declare module '@framework/live2dcubismframework' {
  export const CubismFramework: any
  export const Option: any
  export const LogLevel: any
}

declare module '@demo/lappsubdelegate' {
  export const LAppSubdelegate: any
}

declare module '@demo/lapppal' {
  export const LAppPal: any
}
