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
  // {
  //   name: '低代码页面搭建平台',
  //   tech: ['React', 'Schema', '低代码'],
  //   desc: '支持拖拽组件与 Schema 渲染的页面搭建平台，用于快速生成活动页与业务页面。',
  //   highlights: [
  //     '动态 Schema 渲染引擎（JSON → UI）',
  //     '组件拖拽 + 配置面板（类似低代码平台）',
  //     '支持多端渲染（H5 / 小程序）',
  //   ],
  //   demo: {
  //     type: 'link',
  //     url: '#',
  //   },
  // },
  {
    name: 'RBAC权限系统',
    tech: ['权限系统', '角色管理'],
    desc: '基于角色的权限控制（RBAC）核心功能实现，展示权限控制与角色管理的核心功能。',
    highlights: [
      'monorepo 结构（前端 + 后端）',
      '前端：React + TypeScript + Antd + Vite ',
      '后端：Node.js + Express + MySQL ',
      '体验账号：admin/123456',
    ],
    demo: {
      type: 'link',
      url: 'https://admin.xunyihu.com',
    },
  },
];
