/**
 * adminHelpers.js
 * Pure utility functions shared across Admin feature modules.
 * No state, no side effects — easy to unit test.
 */

/** Map category type key → Vietnamese label */
export function formatCategoryType(cat) {
  switch (cat) {
    case 'PRACTICE_THEMATIC': return 'Luyện theo chuyên đề';
    case 'PRACTICE_FORMAT':   return 'Luyện theo dạng bài tập';
    case 'EXAM_SCHOOL':       return 'Luyện đề Trường / Sở';
    case 'EXAM_THPT':         return 'Luyện đề THPT (Tự soạn)';
    case 'PRACTICE':          return 'Luyện tập';
    case 'EXAM':              return 'Luyện thi';
    default:                  return cat || '';
  }
}

/** Map grade key → Vietnamese label */
export function formatGrade(grade) {
  switch (grade) {
    case 'GRADE_12': return 'Lớp 12';
    case 'GRADE_11': return 'Lớp 11';
    case 'GRADE_10': return 'Lớp 10';
    default:         return grade || '';
  }
}

/** Human-readable relative time (Vietnamese) */
export function getRelativeTime(dateString) {
  if (!dateString) return '';
  const date    = new Date(dateString);
  const now     = new Date();
  const diffMs  = now.getTime() - date.getTime();
  const diffMins  = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays  = Math.floor(diffHours / 24);

  if (diffMins  < 1)  return 'Vừa xong';
  if (diffMins  < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  return `${diffDays} ngày trước`;
}

/** Generate a deterministic Tailwind bg-color class based on email string */
export function getAvatarColor(email) {
  if (!email) return 'bg-gray-500';
  const COLORS = [
    'bg-orange-500', 'bg-teal-500', 'bg-indigo-500',
    'bg-pink-500',   'bg-emerald-500', 'bg-blue-500', 'bg-rose-500',
  ];
  let sum = 0;
  for (let i = 0; i < email.length; i++) sum += email.charCodeAt(i);
  return COLORS[sum % COLORS.length];
}

/**
 * Flatten a recursive topic/category tree into a flat list with `depth` metadata.
 * @param {Array}  items - array of tree nodes
 * @param {number} depth - current depth (start at 0)
 */
export function flattenTree(items, depth = 0) {
  if (!items) return [];
  const result = [];
  items.forEach((item) => {
    result.push({ ...item, depth });
    if (item.children && item.children.length > 0) {
      result.push(...flattenTree(item.children, depth + 1));
    }
  });
  return result;
}

/**
 * Build an ancestor breadcrumb string for a topic/category node.
 * @param {string} nodeId   - id of the target node
 * @param {Array}  flatList - flattened tree (from flattenTree)
 */
export function buildBreadcrumb(nodeId, flatList) {
  const path = [];
  let current = nodeId;
  while (current) {
    const node = flatList.find((n) => n.id === current);
    if (node) {
      path.unshift(node.title || node.name);
      current = node.parentId;
    } else {
      break;
    }
  }
  return path.join(' > ');
}

/**
 * Filter a flat tree list to exclude a node and all its descendants.
 * Used to prevent selecting a node as its own parent in a form.
 */
export function excludeSubtree(excludeId, flatList) {
  if (!excludeId) return flatList;
  const excluded = new Set();
  const collect  = (id) => {
    excluded.add(id);
    flatList.forEach((n) => {
      if (n.parentId === id && !excluded.has(n.id)) collect(n.id);
    });
  };
  collect(excludeId);
  return flatList.filter((n) => !excluded.has(n.id));
}

/**
 * Build a display label list from root categories (for category selects in exams).
 * Returns: [{ id, name, parentName, gradeLabel, displayName }]
 */
export function buildChildCategoryOptions(rootCategories) {
  const options = [];
  rootCategories.forEach((parent) => {
    if (!parent.children) return;
    const gradeLabel =
      parent.grade === 'GRADE_12' ? 'Lớp 12' :
      parent.grade === 'GRADE_11' ? 'Lớp 11' :
      parent.grade === 'GRADE_10' ? 'Lớp 10' : '';
    const prefix = gradeLabel ? `[${gradeLabel}] ` : '';
    parent.children.forEach((child) => {
      options.push({
        id:          child.id,
        name:        child.name,
        parentName:  parent.name,
        gradeLabel,
        displayName: `${prefix}${parent.name} > ${child.name}`,
      });
    });
  });
  return options;
}

/** Format duration from seconds to Vietnamese "X phút Y giây" or "Y giây" or "X phút" */
export function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0 giây';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0 && secs > 0) {
    return `${mins} phút ${secs} giây`;
  } else if (mins > 0) {
    return `${mins} phút`;
  } else {
    return `${secs} giây`;
  }
}
