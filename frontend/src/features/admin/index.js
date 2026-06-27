// Admin features barrel exports
export { default as AdminProfile  } from './profile/AdminProfile';
export { default as AdminReports  } from './reports/AdminReports';
export { default as AdminUsers    } from './users/AdminUsers';
export { default as AdminExams    } from './exams/AdminExams';
export { default as AdminCategories } from './categories/AdminCategories';
export { default as AdminTopics    } from './topics/AdminTopics';
export { default as AdminArticles } from '../../components/AdminArticles';

// ViewModel hooks
export { useAdminProfile    } from './profile/useAdminProfile';
export { useAdminReports    } from './reports/useAdminReports';
export { useAdminTopics     } from './topics/useAdminTopics';
export { useAdminCategories } from './categories/useAdminCategories';
export { useAdminUsers      } from './users/useAdminUsers';
export { useAdminExams      } from './exams/useAdminExams';
export { useAdminOverview   } from './overview/useAdminOverview';
