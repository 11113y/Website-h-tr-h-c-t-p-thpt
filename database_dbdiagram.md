
TableGroup Monochrome {

  users

  subjects

  chapters

  lessons

  questions

  exams

  user_exam_results

  collections

  documents

  articles

  feedbacks

}

Table users [headercolor:#333333] {

  id varchar(36) [pk]

  username varchar(50) [unique,notnull]

  email varchar(100) [unique,notnull]

  password_hash varchar(255) [notnull]

  role varchar(20) [notnull,default:'student']

  points int [default:0]

  streak_count int [default:0]

  last_active_at datetime

  completed_lessons json [default:'[]']

  unlocked_lessons json [default:'[]']

  unlocked_documents json [default:'[]']

  created_at datetime [default:`now()`]

}

Table subjects [headercolor:#333333] {

  id int [pk,increment]

  grade int [notnull]

  name varchar(100) [notnull]

  slug varchar(100) [unique,notnull]

  order_index int [default:0]

}

Table chapters [headercolor:#333333] {

  id varchar(36) [pk]

  subject_id int [notnull]

  name varchar(150) [notnull]

  slug varchar(150) [unique,notnull]

  order_index int [default:0]

}

Table lessons [headercolor:#333333] {

  id varchar(36) [pk]

  chapter_id varchar(36) [notnull]

  title varchar(200) [notnull]

  slug varchar(200) [unique,notnull]

  content text [notnull]

  is_vip boolean [default: false]

  points_required int [default:0]

  order_index int [default:0]

  created_at datetime [default:`now()`]

}

Table questions [headercolor:#333333] {

  id varchar(36) [pk]

  chapter_id varchar(36)

  question_text text [notnull]

  question_type varchar(30) [notnull,default:'single_choice']

  difficulty varchar(20) [notnull,default:'medium']

  explanation text [notnull]

  points int [default:10]

  options json [default:'[]']

  created_at datetime [default:`now()`]

}

Table exams [headercolor:#333333] {

  id varchar(36) [pk]

  title varchar(200) [notnull]

  description text

  subject_id int

  time_limit_minutes int [default:45]

  difficulty varchar(20) [notnull,default:'medium']

  points_rewarded int [default:50]

  question_ids json [default:'[]']

  created_at datetime [default:`now()`]

}

Table user_exam_results [headercolor:#333333] {

  id varchar(36) [pk]

  user_id varchar(36) [notnull]

  exam_id varchar(36) [notnull]

  score decimal(5,2) [notnull]

  points_earned int [default:0]

  time_spent_seconds int [notnull]

  answers json [default:'[]']

  completed_at datetime [default:`now()`]

}

Table collections [headercolor:#333333] {

  id varchar(36) [pk]

  user_id varchar(36) [notnull]

  name varchar(100) [notnull]

  description text

  question_ids json [default:'[]']

  created_at datetime [default:`now()`]

}

Table documents [headercolor:#333333] {

  id varchar(36) [pk]

  subject_id int

  title varchar(200) [notnull]

  description text

  file_url varchar(255) [notnull]

  is_vip boolean [default: false]

  points_required int [default:0]

  download_count int [default:0]

  created_at datetime [default:`now()`]

}

Table articles [headercolor:#333333] {

  id varchar(36) [pk]

  title varchar(200) [notnull]

  content text [notnull]

  summary text

  author_id varchar(36) [notnull]

  created_at datetime [default:`now()`]

}

Table feedbacks [headercolor:#333333] {

  id varchar(36) [pk]

  user_id varchar(36)

  title varchar(200) [notnull]

  content text [notnull]

  feedback_type varchar(50) [notnull,default:'general']

  reference_id varchar(36)

  status varchar(20) [notnull,default:'pending']

  admin_notes text

  created_at datetime [default:`now()`]

}

Ref: subjects.id < chapters.subject_id [update: no action, delete: cascade]

Ref: chapters.id < lessons.chapter_id [update: no action, delete: cascade]

Ref: chapters.id < questions.chapter_id [update: no action, delete: set null]

Ref: subjects.id < exams.subject_id [update: no action, delete: set null]

Ref: users.id < user_exam_results.user_id [update: no action, delete: cascade]

Ref: exams.id < user_exam_results.exam_id [update: no action, delete: cascade]

Ref: users.id < collections.user_id [update: no action, delete: cascade]

Ref: subjects.id < documents.subject_id [update: no action, delete: set null]

Ref: users.id < articles.author_id [update: no action, delete: cascade]

Ref: users.id < feedbacks.user_id [update: no action, delete: set null]
