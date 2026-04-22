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
  demo: Demo[];
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
    demo: [
      {
        type: 'qrcode',
        url: '/images/sam-qrcode.png',
        note: '零售业电商项目，扫码体验（示例）',
      },
    ],
  },
  {
    name: '酒店SaaS系统',
    tech: ['SaaS', '小程序', '公众号'],
    desc: '面向酒店客户的SaaS系统，支持公众号商城、客房预订、订餐等能力。',
    highlights: [
      '支持酒店自营商城（订房 + 商品）',
      '公众号 + 小程序双端运营',
      '动态页面装修（Schema驱动）',
    ],
    demo: [
      {
        type: 'qrcode',
        url: '/images/mgm-qrcode.png',
        note: '自定义营销页，扫码体验（示例）',
      },
      {
        type: 'qrcode',
        url: '/images/ml-qrcode.jpg',
        note: '客房预订，扫码体验（示例）',
      },
      {
        type: 'qrcode',
        url: '/images/yr-qrcode.png',
        note: '订餐服务，扫码体验（示例）',
      },
    ],
  },
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
    demo: [
      {
        type: 'link',
        url: 'https://admin.xunyihu.com',
      },
    ],
  },
];
