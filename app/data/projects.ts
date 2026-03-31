export type Demo =
  | {
      type: 'link';
      url: string;
    }
  | {
      type: 'qrcode';
      url: string;
      note: string;
    };

export type Project = {
  name: string;
  tech: string[];
  desc: string;
  highlights: string[];
  demo: Demo;
};

export const projects: Project[] = [
  {
    name: '小程序电商平台',
    tech: ['小程序', '电商'],
    desc: '电商小程序示例，用于展示完整电商业务流程与交互形态。',
    highlights: [
      '完整电商链路（商品 → 下单 → 支付 → 会员体系）',
      '高质量 UI 与交互体验设计',
    ],
    demo: {
      type: 'qrcode',
      url: '/images/sam-qrcode.png',
      note: '本人参与开发的电商小程序项目，扫码体验（示例）',
    },
  },
  //   {
  //     name: '页面搭建系统',
  //     tech: ['React', 'Schema', '低代码'],
  //     desc: '支持拖拽组件与 Schema 渲染的页面搭建平台，用于快速生成活动页与业务页面。',
  //     highlights: [
  //       '动态 Schema 渲染引擎（JSON → UI）',
  //       '组件拖拽 + 配置面板（类似低代码平台）',
  //       '支持多端渲染（H5 / 小程序）',
  //     ],
  //     demo: {
  //       type: 'link',
  //       url: '#',
  //     },
  //   },
  //   {
  //     name: '酒店 SaaS 商城',
  //     tech: ['Vue', '小程序', '公众号'],
  //     desc: '面向酒店客户的私域电商系统，支持订房 + 商品商城一体化运营。',
  //     highlights: [
  //       '多端统一业务逻辑（公众号 + 小程序）',
  //       '复杂动态表单配置系统（可视化配置）',
  //       '支持多酒店 SaaS 入驻模式',
  //     ],
  //     demo: {
  //       type: 'link',
  //       url: '#',
  //     },
  //   },
];
