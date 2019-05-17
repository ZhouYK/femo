declare var intl: any;

declare module "*.svg" {
  const content: any;
  export default content;
}
interface ConfigReturn {
  install: () => void;
}
interface Raven {
  config: (url: string, options: object) => ConfigReturn;
}
interface Window {
  Raven: Raven;
}

interface ActionStruct {
  type: string;
  payload?: any;
}

declare module '*.less';

declare module '*.svg'
declare module '*.png'
declare module '*.jpg'
declare module '*.jpeg'
declare module '*.gif'
declare module '*.bmp'
declare module '*.tiff'
