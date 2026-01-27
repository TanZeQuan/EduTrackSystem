import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      common: {
        dashboard: "Dashboard",
        students: "Students",
        attendance: "Attendance",
        materials: "Materials",
        feedback: "Feedback",
        progress: "Progress",
        logout: "Logout",
        welcome: "Welcome back",
        language: "Language", // Added
      },
      admin: {
        panel: "Admin Panel",
        role: "Administrator" // Added for the avatar section
      },
      parent: {
        portal: "Parent Portal",
      },
    },
  },
  zh: {
    translation: {
      common: {
        dashboard: "仪表板",
        students: "学生管理",
        attendance: "考勤点名",
        materials: "课程教材",
        feedback: "家校反馈",
        progress: "学习进度",
        logout: "退出登录",
        welcome: "欢迎回来",
        language: "语言 / Language",
      },
      admin: {
        panel: "管理员后台",
        role: "管理员"
      },
      parent: {
        portal: "家长端",
      },
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "en", // Default language
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;