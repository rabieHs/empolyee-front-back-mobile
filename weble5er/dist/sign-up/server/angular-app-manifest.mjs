
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: false,
  baseHref: '/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "redirectTo": "/login",
    "route": "/"
  },
  {
    "renderMode": 2,
    "route": "/minimal"
  },
  {
    "renderMode": 2,
    "route": "/login"
  },
  {
    "renderMode": 2,
    "route": "/register"
  },
  {
    "renderMode": 2,
    "route": "/forgot-password"
  },
  {
    "renderMode": 1,
    "route": "/reset-password/*"
  },
  {
    "renderMode": 2,
    "route": "/admin"
  },
  {
    "renderMode": 2,
    "route": "/admin/calendar"
  },
  {
    "renderMode": 2,
    "route": "/chef"
  },
  {
    "renderMode": 2,
    "redirectTo": "/home/welcome",
    "route": "/home"
  },
  {
    "renderMode": 2,
    "route": "/home/welcome"
  },
  {
    "renderMode": 2,
    "route": "/home/requests"
  },
  {
    "renderMode": 1,
    "route": "/home/requests/new"
  },
  {
    "renderMode": 1,
    "route": "/home/requests/leave"
  },
  {
    "renderMode": 1,
    "route": "/home/requests/leave/edit/*"
  },
  {
    "renderMode": 1,
    "route": "/home/requests/training"
  },
  {
    "renderMode": 1,
    "route": "/home/requests/training/edit/*"
  },
  {
    "renderMode": 1,
    "route": "/home/requests/certificate"
  },
  {
    "renderMode": 1,
    "route": "/home/requests/certificate/edit/*"
  },
  {
    "renderMode": 1,
    "route": "/home/requests/loan"
  },
  {
    "renderMode": 1,
    "route": "/home/requests/loan/edit/*"
  },
  {
    "renderMode": 1,
    "route": "/home/requests/advance"
  },
  {
    "renderMode": 1,
    "route": "/home/requests/advance/edit/*"
  },
  {
    "renderMode": 1,
    "route": "/home/requests/document"
  },
  {
    "renderMode": 1,
    "route": "/home/requests/document/edit/*"
  },
  {
    "renderMode": 1,
    "route": "/home/requests/*"
  },
  {
    "renderMode": 2,
    "route": "/home/profile"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 737, hash: '8d7c294f2ec8a658df10ba9db0009f9f0ae8c579a45d22ce8209954591aa7872', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1277, hash: '83ec2397088a0f43467dded78958dc1a1b5b3e6de295fffe609545dc5902c392', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'minimal/index.html': {size: 1085, hash: '8f020ae5d7858703347ed52cbe08effc753491fbe8e91ff1698cdd51119ff861', text: () => import('./assets-chunks/minimal_index_html.mjs').then(m => m.default)},
    'admin/index.html': {size: 5444, hash: 'de920e8f1f989fcaff495e5e1f8a2658e13a02171b00149bbc7bea653445f4af', text: () => import('./assets-chunks/admin_index_html.mjs').then(m => m.default)},
    'login/index.html': {size: 5444, hash: 'de920e8f1f989fcaff495e5e1f8a2658e13a02171b00149bbc7bea653445f4af', text: () => import('./assets-chunks/login_index_html.mjs').then(m => m.default)},
    'register/index.html': {size: 7196, hash: 'a1d5de95601c9b006bdb3cd6c94fb8407ea0aaf1ccada7ff5f97614d040e2ee6', text: () => import('./assets-chunks/register_index_html.mjs').then(m => m.default)},
    'chef/index.html': {size: 5444, hash: 'de920e8f1f989fcaff495e5e1f8a2658e13a02171b00149bbc7bea653445f4af', text: () => import('./assets-chunks/chef_index_html.mjs').then(m => m.default)},
    'home/welcome/index.html': {size: 5444, hash: '017cadbc8846b79df79c3b58e013c2af2117ff8a67cd6f0e7dad3d19c3171ef9', text: () => import('./assets-chunks/home_welcome_index_html.mjs').then(m => m.default)},
    'home/requests/index.html': {size: 5444, hash: 'de920e8f1f989fcaff495e5e1f8a2658e13a02171b00149bbc7bea653445f4af', text: () => import('./assets-chunks/home_requests_index_html.mjs').then(m => m.default)},
    'home/profile/index.html': {size: 5444, hash: '017cadbc8846b79df79c3b58e013c2af2117ff8a67cd6f0e7dad3d19c3171ef9', text: () => import('./assets-chunks/home_profile_index_html.mjs').then(m => m.default)},
    'admin/calendar/index.html': {size: 5444, hash: 'de920e8f1f989fcaff495e5e1f8a2658e13a02171b00149bbc7bea653445f4af', text: () => import('./assets-chunks/admin_calendar_index_html.mjs').then(m => m.default)},
    'forgot-password/index.html': {size: 6653, hash: 'b02fd5f5fdd6acefd5870208ab1cf76ff2b0c7a2b93f0f88eff41f2bbb626369', text: () => import('./assets-chunks/forgot-password_index_html.mjs').then(m => m.default)}
  },
};
