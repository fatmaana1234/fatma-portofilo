import {
  initFirebase,
  OperationType,
  handleFirestoreError,
  collection,
  doc,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from './firebase-client.js';

let db = null;

function showNotice(message, isError = false) {
  let toast = document.getElementById('site-toast-banner');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'site-toast-banner';
    toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:9999;padding:0.85rem 1.4rem;border-radius:12px;font-weight:600;font-size:0.92rem;box-shadow:0 10px 30px rgba(0,0,0,0.35);backdrop-filter:blur(12px);max-width:90vw;text-align:center;transition:opacity 0.25s ease;';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.background = isError ? 'rgba(239, 68, 68, 0.92)' : 'rgba(16, 185, 129, 0.92)';
  toast.style.color = '#ffffff';
  toast.style.opacity = '1';
  toast.style.display = 'block';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => { toast.style.display = 'none'; }, 260);
  }, 4000);
}

/* ==========================================================================
   State Management
   ========================================================================== */
let currentLang = localStorage.getItem('site_lang') || 'en';
let currentTheme = localStorage.getItem('site_theme') || 'dark';
let soundEnabled = localStorage.getItem('sound_enabled') !== 'false';
let allProjectsCache = [];
let currentFilter = 'all';
let visibleCount = 6;
const MOBILE_INITIAL_COUNT = 4;
const DESKTOP_INITIAL_COUNT = 999;

const htmlElement = document.documentElement;
const langToggleBtn = document.getElementById('langToggle');
const themeToggleBtn = document.getElementById('themeToggle');
const sunIcon = document.querySelector('.sun-icon');
const moonIcon = document.querySelector('.moon-icon');
const hamburgerBtn = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
const scrollTopBtn = document.getElementById('scrollTopBtn');
const soundToggleBtn = document.getElementById('soundToggle');
const navbar = document.getElementById('navbar');
const scrollProgress = document.getElementById('scrollProgress');
const preloader = document.getElementById('preloader');

/* ==========================================================================
   Translations (Complete — covers EVERY visible string)
   ========================================================================== */
const translations = {
    en: {
        // Brand & nav
        brand: 'Fatma <span>Rabie</span>',
        nav_home: "Home", nav_about: "About", nav_experience: "Experience",
        nav_services: "Services", nav_projects: "Projects",
        nav_contact: "Contact",

        // Preloader
        preloader_text: "Loading Experience…",

        // Hero
        hero_pill: "Digital Operations & Technology Specialist",
        hero_title: "Driving Seamless <span>Digital Operations</span>, Tech Solutions & Content",
        hero_subtitle: "B.Ed. in Educational Technology (Mansoura University) — bridging business operations, WordPress & WooCommerce management, AI Arabic content projects, educational platforms, and digital media for clients across Saudi Arabia, Oman, and Egypt.",
        hero_cta1: "Explore My Work", hero_cta2: "Get In Touch",
        stat_projects: "Projects & Deliverables", stat_years: "Years Experience", stat_markets: "Markets (KSA • Oman • EG)",
        badge_1: "Digital Operations ✦", badge_2: "AI & Tech Solutions ⚡",

        // About
        about_heading: "About Me",
        about_text_full: "I am Fatma Rabie Mahmoud Ali Hammad, a Digital Operations & Technology Specialist holding a Bachelor's degree in Educational Technology from Mansoura University. I bring practical experience coordinating business operations across diverse entities, managing WordPress and WooCommerce platforms, supporting AI-related Arabic content projects, and delivering educational websites and visual presentations.",
        career_obj_heading: "Operational Philosophy",
        career_obj_text: "Experienced in overseeing teams, delegating tasks, organizing digital resources, and providing dependable technical and administrative support for clients across Saudi Arabia, Oman, and Egypt — always adaptable, organized, and committed to meeting deadlines.",
        exp_title: "Core Operational Scope",
        exp_1: "Digital operations, workflow coordination & team leadership",
        exp_2: "WordPress websites & WooCommerce store operations",
        exp_3: "AI project support, Arabic content review & prompt preparation",
        exp_4: "Educational websites, 3D presentations & technical training",
        exp_5: "Remote collaboration with clients in KSA, Oman & Egypt",
        meta_degree: "🎓 B.Ed. Educational Technology — Mansoura Univ. (2023)",
        meta_location: "📍 Sherbin, Dakahlia, Egypt",

        // Experience & Credentials Timeline
        timeline_heading: "Experience & Credentials",
        timeline_subtitle: "A multi-disciplinary track record spanning digital operations, executive coordination, AI content, and educational technology.",
        job1_period: "Present · Part-Time",
        job1_loc: "Saudi Arabia",
        job1_title: "Digital Operations & Technology Specialist",
        job1_b1: "Manage and update WordPress websites and WooCommerce store operations.",
        job1_b2: "Organize digital content across platforms and support YouTube & short-form video preparation.",
        job1_b3: "Coordinate directly with the business owner, manage priorities, and execute technical & administrative tasks.",

        job2_period: "2026 · 3 Months",
        job2_loc: "Oman",
        job2_title: "Chief Executive Officer (CEO) – Business Operations",
        job2_org: "Private Business Group",
        job2_b1: "Led and managed business operations across a manufacturing factory and a medical complex.",
        job2_b2: "Oversaw staff, delegated responsibilities, coordinated teams, and monitored execution across both entities.",
        job2_b3: "Supported technical & programming tasks, graphic design, digital content, and executive planning.",

        job3_period: "2026",
        job3_loc: "Saudi Arabia",
        job3_title: "AI Content & Projects Specialist",
        job3_org: "AI AstorLab",
        job3_b1: "Prepared, edited, and reviewed Arabic-language content for AI projects ensuring grammar, clarity, and consistency.",
        job3_b2: "Wrote prompts, descriptions, and structured text used within AI systems and digital tools.",
        job3_b3: "Organized and uploaded platform content while supporting data and content quality improvement.",

        job4_period: "2026 · 6 Weeks",
        job4_loc: "Saudi Arabia (Freelance)",
        job4_title: "Educational Website Designer",
        job4_b1: "Designed and delivered four structured educational websites for Saudi PhD researchers.",
        job4_b2: "Organized educational materials via Google Drive and managed revisions, feedback, and final delivery.",

        job5_period: "2024 · 2 Months",
        job5_loc: "Oman (Freelance)",
        job5_title: "Educational Presentation Designer",
        job5_b1: "Designed interactive educational PowerPoint presentations with 3D visual elements for schools.",
        job5_b2: "Transformed curriculum content into clear, visually organized learning experiences.",

        job6_period: "2023 & Public Service",
        job6_loc: "KSA & Egypt",
        job6_title: "ASP.NET Trainer & Technical / Admin Support",
        job6_b1: "Delivered practical ASP.NET training and technical guidance to a Saudi client over two months.",
        job6_b2: "Provided computer troubleshooting, Word/Excel administration, and ongoing tech support at an educational institution in Sherbin, Egypt.",

        edu_heading: "🎓 Education & Key Project",
        edu_degree: "Bachelor of Educational Technology",
        edu_uni: "Faculty of Specific Education, Mansoura University · 2023",
        grad_title: "Graduation Project — Educational Programming Website",
        grad_desc: "Led a 5-member team, distributed tasks, and built the WordPress educational platform and programming materials.",

        cert_heading: "🏅 Certifications & Training",
        cert_1: "ICDL (International Certification of Digital Literacy)",
        cert_2: "English Language Certificate — Maaref Platform",
        cert_3: "Edraak Training: Electronic Game Design & Computer/IT",
        cert_4: "Computer & Digital Tools Training — Mansoura (2019)",
        cert_5: "Women's Empowerment Training — Mawaddah Initiative, Ministry of Social Solidarity",

        // Skills
        skills_heading: "Core Competencies & Skills",
        skills_ops: "Digital Operations & Platforms",
        skills_technical: "AI, Tech & Design",
        skills_professional: "Leadership & Operations",
        skill_1: "Digital Operations & Workflow",
        skill_2: "WordPress & WooCommerce",
        skill_3: "Digital Content Management",
        skill_4: "YouTube & Short-Form Video",
        skill_5: "Microsoft Word, Excel & PowerPoint",
        skill_6: "Google Drive Organization",
        skill_7: "AI Project Support",
        skill_8: "Arabic AI Content & Review",
        skill_9: "Prompt & Description Writing",
        skill_10: "Educational Technology",
        skill_11: "Graphic & Motion Design",
        skill_12: "Technical Troubleshooting & ASP.NET",
        skill_13: "Project & Task Coordination",
        skill_14: "Team Leadership & Delegation",
        skill_15: "Client Communication (KSA & Oman)",
        skill_16: "Customer Service & Admin Support",
        skill_17: "Problem Solving & Multitasking",
        skill_18: "Deadline Management",

        // Services
        services_heading: "What I Deliver",
        srv_1_title: "Digital & Business Operations",
        srv_1_desc: "End-to-end workflow coordination, team task follow-up, executive administrative support, and multi-platform operations management.",
        srv_2_title: "WordPress & WooCommerce Management",
        srv_2_desc: "Building, customizing, updating, and maintaining responsive WordPress websites and live WooCommerce online stores.",
        srv_3_title: "AI Content & Prompt Operations",
        srv_3_desc: "Crafting, editing, and quality-reviewing Arabic AI content, structured prompts, descriptions, and digital platform datasets.",
        srv_4_title: "Educational Tech & 3D Presentations",
        srv_4_desc: "Designing educational websites for researchers and interactive 3D-element PowerPoint presentations for academic learning.",
        srv_5_title: "Motion Graphics & Digital Media",
        srv_5_desc: "Creating graphic designs, motion graphics, short-form video content, and supporting YouTube channel operations.",
        srv_6_title: "Technical Training & User Support",
        srv_6_desc: "Technical troubleshooting, simplified software/ASP.NET guidance, Google Drive organization, and responsive client support.",

        // Projects
        projects_heading: "Featured Projects",
        projects_subtitle: "My newest creative, motion, brand identity & digital operations deliverables — plus WordPress & WooCommerce platforms and educational websites.",
        filter_all: "All",
        filter_graphic: "Graphic Design",
        filter_motion: "Motion Graphics",
        filter_branding: "Brand & Location Maps",
        filter_wordpress: "Websites & Platforms",
        filter_english: "English Learning",
        filter_arabic: "Arabic Language",
        filter_science: "Science",
        filter_math: "Mathematics",
        filter_social: "Social Studies",
        filter_islamic: "Islamic Studies",
        filter_health: "Health & Activity",
        filter_other: "Other",
        show_more: "Show More",
        show_less: "Show Less",
        no_projects: "No projects available yet.",
        preview_project: "Preview Project",
        preview_insite: "Open Inside Site",
        cat_graphic: "Graphic Design Suite",
        cat_motion: "Motion Graphics",
        cat_branding: "Brand Identity & Maps",
        cat_wordpress: "Web & Platform",
        cat_creative: "Creative Work",
        cat_english: "English Learning",
        cat_arabic: "Arabic Language",
        cat_science: "Science",
        cat_math: "Mathematics",
        cat_social: "Social Studies",
        cat_islamic: "Islamic Studies",
        cat_health: "Health & Activity",
        pv_gallery_hint: "Click any design poster below to inspect it full-screen inside the site",
        pv_items_count: "Curated Designs",
        pv_tab_brand: "Brand Guidelines & Location Maps",
        pv_tab_icons: "Clinic UI Assets & Icons",
        pv_video_playlist: "All Videos",

        // Slider
        slider_heading: "Project Highlights",
        slider_subtitle: "A quick glimpse of recent work — swipe through to explore.",

        // Testimonials
        testimonials_heading: "What Clients Say",
        review_leave_heading: "Leave a Review",
        review_ph_name: "Your Name",
        review_ph_text: "Write your feedback...",
        review_submit: "Submit Review",
        no_reviews: "No reviews yet.",
        review_thanks: "Thank you for your review! It will appear shortly.",

        // Contact
        contact_heading: "Let's Work Together",
        contact_text: "Looking for reliable digital operations, technical support, WordPress management, or AI & creative content? I'd love to connect.",
        contact_email_label: "Email",
        contact_linkedin_label: "LinkedIn Profile",
        contact_location: "Sherbin, Dakahlia, Egypt",
        contact_ph_name: "Name",
        contact_ph_email: "Email",
        contact_ph_message: "Message",
        contact_submit: "Send Message",
        contact_success: "Message sent! I'll get back to you soon.",

        // Footer
        footer_rights: "&copy; <span id='year'></span> Fatma Rabie. All Rights Reserved.",
        footer_admin: "Admin Login",

        // Chatbot
        chat_title: "AI Assistant",
        chat_status: "Online",
        chat_ph: "Type a message...",
        chat_q1: "Experience & CV",
        chat_q2: "Services",
        chat_q3: "Contact Fatma",
        chat_welcome: "Hi there! I'm Fatma Rabie's virtual assistant. Fatma is a Digital Operations & Technology Specialist — ask me about her experience, services, or how to reach her! ✨"
    },
    ar: {
        // Brand & nav
        brand: 'فاطمة <span>ربيع</span>',
        nav_home: "الرئيسية", nav_about: "نبذة عني", nav_experience: "الخبرات",
        nav_services: "خدماتي", nav_projects: "مشاريعي",
        nav_contact: "تواصل معي",

        // Preloader
        preloader_text: "جارٍ التحضير…",

        // Hero
        hero_pill: "أخصائية العمليات الرقمية والتكنولوجيا",
        hero_title: "إدارة <span>العمليات الرقمية</span> والحلول التقنية وصناعة المحتوى باحترافية",
        hero_subtitle: "خريجة تكنولوجيا التعليم (جامعة المنصورة) — أجمع بين تنسيق العمليات التشغيلية، إدارة منصات ووردبريس وووكومرس، دعم مشاريع الذكاء الاصطناعي والمحتوى العربي، وتصميم المواقع التعليمية والوسائط الرقمية لعملاء في السعودية وعُمان ومصر.",
        hero_cta1: "استكشف أعمالي", hero_cta2: "تواصل معي",
        stat_projects: "مشروع وعمل رقمي", stat_years: "سنوات خبرة", stat_markets: "أسواق (السعودية • عُمان • مصر)",
        badge_1: "العمليات الرقمية ✦", badge_2: "الذكاء الاصطناعي والتقنية ⚡",

        // About
        about_heading: "نبذة عني",
        about_text_full: "أنا فاطمة ربيع محمود علي حماد، أخصائية العمليات الرقمية والتكنولوجيا، حاصلة على بكالوريوس تكنولوجيا التعليم من جامعة المنصورة. أمتلك خبرة عملية في تنسيق العمليات التشغيلية والإدارية، إدارة منصات ووردبريس وووكومرس، دعم مشاريع الذكاء الاصطناعي والمحتوى العربي، وتطوير المواقع التعليمية والعروض التقديمية الاحترافية.",
        career_obj_heading: "منهجية العمل",
        career_obj_text: "خبرة في الإشراف على الفرق وتوزيع المهام، تنظيم الموارد الرقمية، وتقديم الدعم الفني والإداري الموثوق لعملاء في المملكة العربية السعودية وسلطنة عُمان ومصر — مع التزام تام بالجودة والدقة والمواعيد النهائية.",
        exp_title: "نطاق العمل الأساسي",
        exp_1: "العمليات الرقمية، تنسيق سير العمل، وقيادة الفرق",
        exp_2: "إدارة مواقع ووردبريس وعمليات متاجر ووكومرس",
        exp_3: "دعم مشاريع الذكاء الاصطناعي ومراجعة المحتوى العربي والأوامر",
        exp_4: "المواقع التعليمية، العروض ثلاثية الأبعاد، والتدريب التقني",
        exp_5: "التعاون عن بُعد مع عملاء في السعودية وعُمان ومصر",
        meta_degree: "🎓 بكالوريوس تكنولوجيا التعليم — جامعة المنصورة (2023)",
        meta_location: "📍 شربين، الدقهلية، مصر",

        // Experience & Credentials Timeline
        timeline_heading: "الخبرات العملية والمؤهلات",
        timeline_subtitle: "مسيرة مهنية متعددة التخصصات تجمع بين العمليات الرقمية، الإدارة التنفيذية، محتوى الذكاء الاصطناعي، وتكنولوجيا التعليم.",
        job1_period: "الحالي · دوام جزئي",
        job1_loc: "المملكة العربية السعودية",
        job1_title: "أخصائية العمليات الرقمية والتكنولوجيا",
        job1_b1: "إدارة وتحديث مواقع ووردبريس وتشغيل ومتابعة متاجر ووكومرس.",
        job1_b2: "تنظيم المحتوى الرقمي عبر المنصات ودعم إدارة قناة يوتيوب وتجهيز الفيديوهات القصيرة.",
        job1_b3: "التواصل المباشر مع صاحب العمل، ترتيب الأولويات، وتنفيذ المهام التقنية والإدارية.",

        job2_period: "2026 · 3 أشهر",
        job2_loc: "سلطنة عُمان",
        job2_title: "المدير التنفيذي للعمليات (CEO – Business Operations)",
        job2_org: "مجموعة أعمال خاصة",
        job2_b1: "قيادة وإدارة العمليات التشغيلية عبر مصنع إنتاجي ومجمع طبي.",
        job2_b2: "الإشراف على الموظفين، تفويض المهام، تنسيق الفرق، ومتابعة تنفيذ الأعمال عبر الكيانين.",
        job2_b3: "دعم العمليات التقنية والمهام البرمجية، المساهمة في التصميم الجرافيكي والمحتوى والتخطيط التنفيذي.",

        job3_period: "2026",
        job3_loc: "المملكة العربية السعودية",
        job3_title: "أخصائية محتوى ومشاريع الذكاء الاصطناعي",
        job3_org: "AI AstorLab",
        job3_b1: "إعداد وتحرير ومراجعة المحتوى العربي لمشاريع الذكاء الاصطناعي لضمان السلامة اللغوية والوضوح.",
        job3_b2: "كتابة الأوامر (Prompts) والأوصاف والنصوص المهيكلة المستخدمة في أنظمة الذكاء الاصطناعي.",
        job3_b3: "تنظيم ورفع المحتوى على المنصات الرقمية ودعم تحسين جودة البيانات والمحتوى.",

        job4_period: "2026 · 6 أسابيع",
        job4_loc: "السعودية (عمل حر)",
        job4_title: "مصممة مواقع تعليمية",
        job4_b1: "تصميم وتطوير وتسليم أربعة مواقع تعليمية متكاملة لباحثين دكتوراه في السعودية.",
        job4_b2: "تنظيم المواد التعليمية عبر Google Drive وإدارة التعديلات وملاحظات العملاء حتى التسليم.",

        job5_period: "2024 · شهران",
        job5_loc: "عُمان (عمل حر)",
        job5_title: "مصممة عروض تعليمية",
        job5_b1: "تصميم عروض تقديمية تعليمية احترافية مدعومة بعناصر تصميم ثلاثية الأبعاد للمدارس.",
        job5_b2: "تحويل المحتوى الدراسي إلى عروض مرئية واضحة ومنظمة وجذابة.",

        job6_period: "2023 والخدمة العامة",
        job6_loc: "السعودية ومصر",
        job6_title: "مدربة ASP.NET والدعم الفني والإداري",
        job6_b1: "تقديم تدريب عملي وإرشاد تقني في ASP.NET لعميل في السعودية لمدة شهرين.",
        job6_b2: "تقديم الدعم الفني وحل مشكلات الحاسب والمهام الإدارية (Word/Excel) بمؤسسة تعليمية في شربين.",

        edu_heading: "🎓 التعليم ومشروع التخرج",
        edu_degree: "بكالوريوس تكنولوجيا التعليم",
        edu_uni: "كلية التربية النوعية، جامعة المنصورة · 2023",
        grad_title: "مشروع التخرج — موقع تعليمي للبرمجة",
        grad_desc: "قيادة فريق مكون من 5 طلاب وتوزيع المهام وبناء الموقع التعليمي باستخدام ووردبريس وإدارة المواد البرمجية.",

        cert_heading: "🏅 الشهادات والتدريب",
        cert_1: "شهادة ICDL الدولية لمهارات الحاسب والتحول الرقمي",
        cert_2: "شهادة اللغة الإنجليزية — منصة معارف",
        cert_3: "دورات منصة إدراك: تصميم الألعاب الإلكترونية، وتكنولوجيا المعلومات",
        cert_4: "تدريب الحاسب الآلي والأدوات الرقمية — المنصورة (2019)",
        cert_5: "تدريب تمكين ودعم المرأة — مبادرة مودة، وزارة التضامن الاجتماعي",

        // Skills
        skills_heading: "المهارات والكفاءات الأساسية",
        skills_ops: "العمليات الرقمية والمنصات",
        skills_technical: "الذكاء الاصطناعي والتقنية والتصميم",
        skills_professional: "القيادة والتنسيق المهني",
        skill_1: "العمليات الرقمية وتنسيق سير العمل",
        skill_2: "إدارة ووردبريس وووكومرس",
        skill_3: "إدارة المحتوى الرقمي",
        skill_4: "إدارة يوتيوب والفيديوهات القصيرة",
        skill_5: "مايكروسوفت وورد وإكسل وباوربوينت",
        skill_6: "تنظيم ملفات Google Drive",
        skill_7: "دعم مشاريع الذكاء الاصطناعي",
        skill_8: "المحتوى العربي للذكاء الاصطناعي والمراجعة",
        skill_9: "كتابة الأوامر (Prompts) والأوصاف",
        skill_10: "تكنولوجيا التعليم",
        skill_11: "التصميم الجرافيكي والموشن جرافيك",
        skill_12: "الدعم الفني وASP.NET",
        skill_13: "تنسيق المشاريع والمهام",
        skill_14: "قيادة الفرق وتفويض المهام",
        skill_15: "التواصل مع العملاء (السعودية وعُمان)",
        skill_16: "خدمة العملاء والمساندة الإدارية",
        skill_17: "حل المشكلات وتعدد المهام",
        skill_18: "الالتزام بالمواعيد النهائية",

        // Services
        services_heading: "الخدمات التي أقدمها",
        srv_1_title: "إدارة العمليات الرقمية والتشغيلية",
        srv_1_desc: "تنسيق سير العمل اليومي، متابعة المهام والفرق، المساندة الإدارية والتنفيذية، وإدارة العمليات عبر المنصات.",
        srv_2_title: "إدارة مواقع ووردبريس وووكومرس",
        srv_2_desc: "تصميم وتحديث وإدارة مواقع الووردبريس ومتاجر ووكومرس الإلكترونية وضمان جاهزيتها واستقرارها.",
        srv_3_title: "محتوى الذكاء الاصطناعي وإعداد الأوامر",
        srv_3_desc: "إعداد وتحرير ومراجعة المحتوى العربي لمشاريع الذكاء الاصطناعي وكتابة الأوامر (Prompts) وتحسين جودة البيانات.",
        srv_4_title: "المواقع التعليمية والعروض ثلاثية الأبعاد",
        srv_4_desc: "بناء مواقع تعليمية للباحثين وتصميم عروض PowerPoint تفاعلية مدعومة بعناصر ثلاثية الأبعاد.",
        srv_5_title: "الموشن جرافيك والجرافيك والمحتوى المرئي",
        srv_5_desc: "تنفيذ تصاميم الموشن جرافيك والجرافيك، الفيديوهات القصيرة، ودعم إدارة محتوى قنوات يوتيوب.",
        srv_6_title: "التدريب التقني والدعم الفني والإداري",
        srv_6_desc: "حل المشكلات التقنية، التدريب المبسط على البرمجيات وASP.NET، تنظيم Google Drive، وخدمة العملاء.",

        // Projects
        projects_heading: "أبرز الأعمال والمشاريع",
        projects_subtitle: "أحدث أعمالي في التصميم الجرافيكي، الموشن جرافيك، والهوية البصرية والخرائط (عُمان) — بجانب منصات ووردبريس وووكومرس والمواقع التعليمية.",
        filter_all: "الكل",
        filter_graphic: "تصاميم الجرافيك",
        filter_motion: "الموشن جرافيك",
        filter_branding: "الهوية البصرية والخرائط",
        filter_wordpress: "المواقع والمنصات",
        filter_english: "تعلم الإنجليزية",
        filter_arabic: "اللغة العربية",
        filter_science: "العلوم",
        filter_math: "الرياضيات",
        filter_social: "الدراسات الاجتماعية",
        filter_islamic: "الدراسات الإسلامية",
        filter_health: "الصحة والنشاط",
        filter_other: "أخرى",
        show_more: "عرض المزيد",
        show_less: "عرض أقل",
        no_projects: "لا توجد مشاريع حالياً.",
        preview_project: "معاينة المشروع",
        preview_insite: "عرض داخل الموقع",
        cat_graphic: "تصاميم جرافيك",
        cat_motion: "موشن جرافيك",
        cat_branding: "الهوية البصرية والخرائط",
        cat_wordpress: "موقع / منصة رقمية",
        cat_creative: "عمل إبداعي",
        cat_english: "تعلم الإنجليزية",
        cat_arabic: "اللغة العربية",
        cat_science: "العلوم",
        cat_math: "الرياضيات",
        cat_social: "الدراسات الاجتماعية",
        cat_islamic: "الدراسات الإسلامية",
        cat_health: "الصحة والنشاط",
        pv_gallery_hint: "اضغط على أي تصميم لعرضه بالحجم الكامل داخل الموقع والتنقل بين التصاميم",
        pv_items_count: "تصميم مختار بعناية",
        pv_tab_brand: "لوحات الهوية البصرية وخرائط الموقع",
        pv_tab_icons: "أيقونات وواجهات المجمع الطبي",
        pv_video_playlist: "قائمة الفيديوهات",

        // Slider
        slider_heading: "أبرز المشاريع",
        slider_subtitle: "لمحة سريعة عن أحدث الأعمال — اسحب للتنقل بينها.",

        // Testimonials
        testimonials_heading: "ماذا يقول العملاء",
        review_leave_heading: "اترك تقييمك",
        review_ph_name: "اسمك",
        review_ph_text: "اكتب ملاحظاتك...",
        review_submit: "إرسال التقييم",
        no_reviews: "لا توجد تقييمات بعد.",
        review_thanks: "شكراً لتقييمك! سيظهر قريباً.",

        // Contact
        contact_heading: "لنعمل معاً",
        contact_text: "هل تبحثين أو تبحث عن أخصائية عمليات رقمية، إدارة منصات، دعم تقني، أو محتوى ذكاء اصطناعي وتصاميم إبداعية؟ يسعدني تواصلك.",
        contact_email_label: "البريد الإلكتروني",
        contact_linkedin_label: "ملف لينكدإن",
        contact_location: "شربين، الدقهلية، مصر",
        contact_ph_name: "الاسم",
        contact_ph_email: "البريد الإلكتروني",
        contact_ph_message: "الرسالة",
        contact_submit: "إرسال الرسالة",
        contact_success: "تم إرسال رسالتك! سأرد عليك قريباً.",

        // Footer
        footer_rights: "&copy; <span id='year'></span> فاطمة ربيع. جميع الحقوق محفوظة.",
        footer_admin: "دخول المسؤول",

        // Chatbot
        chat_title: "المساعد الذكي",
        chat_status: "نشط الآن",
        chat_ph: "اكتب رسالة...",
        chat_q1: "الخبرات والسيرة الذاتية",
        chat_q2: "الخدمات",
        chat_q3: "تواصل مع فاطمة",
        chat_welcome: "مرحباً! أنا المساعد الخاص بفاطمة ربيع — أخصائية العمليات الرقمية والتكنولوجيا. يمكنك سؤالي عن خبراتها أو خدماتها أو طرق التواصل معها! ✨"
    }
};

/* ==========================================================================
   Theme Functions  (FIX: properly update currentTheme on toggle)
   ========================================================================== */
function setTheme(theme) {
    currentTheme = theme; // 🔑 critical fix — update the variable
    htmlElement.setAttribute('data-theme', theme);
    localStorage.setItem('site_theme', theme);
    if (sunIcon && moonIcon) {
        sunIcon.style.display = theme === 'dark' ? 'block' : 'none';
        moonIcon.style.display = theme === 'dark' ? 'none' : 'block';
    }
}
if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        const next = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        playSound('toggle');
    });
}

/* ==========================================================================
   Language Functions
   ========================================================================== */
function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('site_lang', lang);
    htmlElement.setAttribute('lang', lang);
    htmlElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

    // Update text content
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            el.innerHTML = translations[lang][key];
        }
    });
    // Update placeholders
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
        const key = el.getAttribute('data-i18n-ph');
        if (translations[lang] && translations[lang][key]) {
            el.setAttribute('placeholder', translations[lang][key]);
        }
    });
    // Update lang toggle label
    const langLabel = document.querySelector('.lang-label');
    if (langLabel) langLabel.textContent = lang === 'en' ? 'AR' : 'EN';

    // Re-render dynamic content that has language-dependent text
    if (allProjectsCache.length) {
        renderProjects(allProjectsCache, currentFilter);
        renderSlider(allProjectsCache);
    }
    // Update year span if footer rebuilt
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
}
if (langToggleBtn) {
    langToggleBtn.addEventListener('click', () => {
        const next = currentLang === 'en' ? 'ar' : 'en';
        setLanguage(next);
        playSound('toggle');
    });
}

/* ==========================================================================
   Mobile Menu / Hamburger  (FIX: was completely missing event binding)
   ========================================================================== */
function closeMobileMenu() {
    if (!navLinks || !hamburgerBtn) return;
    navLinks.classList.remove('active');
    hamburgerBtn.classList.remove('active');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    if (mobileMenuOverlay) mobileMenuOverlay.classList.remove('active');
    document.body.style.overflow = '';
}
function openMobileMenu() {
    if (!navLinks || !hamburgerBtn) return;
    navLinks.classList.add('active');
    hamburgerBtn.classList.add('active');
    hamburgerBtn.setAttribute('aria-expanded', 'true');
    if (mobileMenuOverlay) mobileMenuOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}
function toggleMobileMenu() {
    if (navLinks.classList.contains('active')) {
        closeMobileMenu();
    } else {
        openMobileMenu();
    }
    playSound('toggle');
}
if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', toggleMobileMenu);
}
if (mobileMenuOverlay) {
    mobileMenuOverlay.addEventListener('click', closeMobileMenu);
}
// Close menu when a nav link is clicked
if (navLinks) {
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });
}
// Close modals / lightbox / menu on Escape & navigate lightbox with arrows
document.addEventListener('keydown', (e) => {
    const lb = document.getElementById('pvLightbox');
    const modal = document.getElementById('projectViewerModal');
    if (lb && lb.classList.contains('active')) {
        if (e.key === 'Escape') { closeLightbox(); return; }
        if (e.key === 'ArrowRight') { stepLightbox(currentLang === 'ar' ? -1 : 1); return; }
        if (e.key === 'ArrowLeft') { stepLightbox(currentLang === 'ar' ? 1 : -1); return; }
    }
    if (e.key === 'Escape') {
        if (modal && modal.classList.contains('active')) {
            closeProjectViewer();
        } else {
            closeMobileMenu();
        }
    }
});

/* ==========================================================================
   Sound System (subtle UI feedback)
   ========================================================================== */
let audioCtx = null;
function getAudioCtx() {
    if (!audioCtx) {
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) { return null; }
    }
    return audioCtx;
}
function playSound(type) {
    if (!soundEnabled) return;
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const freqMap = {
        toggle: 660,
        click: 880,
        hover: 1200,
        send: 540,
        open: 720
    };
    osc.frequency.value = freqMap[type] || 660;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.16);
}
function updateSoundToggleUI() {
    if (!soundToggleBtn) return;
    const onIcon = soundToggleBtn.querySelector('.sound-on-icon');
    const offIcon = soundToggleBtn.querySelector('.sound-off-icon');
    if (onIcon && offIcon) {
        onIcon.style.display = soundEnabled ? 'block' : 'none';
        offIcon.style.display = soundEnabled ? 'none' : 'block';
    }
    soundToggleBtn.setAttribute('aria-pressed', soundEnabled);
}
if (soundToggleBtn) {
    soundToggleBtn.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        localStorage.setItem('sound_enabled', soundEnabled);
        updateSoundToggleUI();
        if (soundEnabled) playSound('toggle');
    });
    updateSoundToggleUI();
}

/* ==========================================================================
   Scroll Progress + Navbar behaviour + Scroll-to-top
   ========================================================================== */
let lastScrollY = 0;
function onScroll() {
    const sy = window.scrollY;
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docH > 0 ? (sy / docH) * 100 : 0;
    if (scrollProgress) scrollProgress.style.width = progress + '%';

    // Navbar hide on scroll down, show on scroll up
    if (navbar) {
        if (sy > 60) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');
        if (sy > 240 && sy > lastScrollY) {
            navbar.classList.add('hidden-nav');
        } else {
            navbar.classList.remove('hidden-nav');
        }
    }

    // Scroll-to-top button
    if (scrollTopBtn) {
        if (sy > 400) scrollTopBtn.classList.add('visible');
        else scrollTopBtn.classList.remove('visible');
    }

    lastScrollY = sy;
}
window.addEventListener('scroll', onScroll, { passive: true });
if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        playSound('click');
    });
}

/* ==========================================================================
   Animated counters for hero stats
   ========================================================================== */
function animateCounter(el, target) {
    const duration = 1800;
    const startTime = performance.now();
    const step = (now) => {
        const t = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.floor(eased * target);
        if (t < 1) requestAnimationFrame(step);
        else el.textContent = target;
    };
    requestAnimationFrame(step);
}

/* ==========================================================================
   Projects Data  (built-in, with rich categories)
   ========================================================================== */
const myProjects = [
    {
        title: "Umm Al-Qura Medical Complex — Graphic Design Campaigns (43 Posters)",
        title_ar: "مجمع أم القرى الطبي (عُمان) — معرض تصاميم الجرافيك والحملات الإعلانية (43 تصميماً)",
        desc: "Latest graphic design suite created for Mr. Ahmed's medical complex project in Barka, Oman — covering physiotherapy & rehabilitation campaigns, shockwave & lymphatic devices, office ergonomics, corporate wellness, patient testimonials, and seasonal greetings. Click to view all 43 curated designs inside the site.",
        desc_ar: "أحدث مجموعة تصاميم جرافيك وحملات سوشيال ميديا لمشروع أ. أحمد (مجمع أم القرى الطبي بولاية بركاء، سلطنة عُمان) — تشمل تصاميم برامج التأهيل الحركي والعصبي، إصابات الملاعب، أجهزة الموجات التصادمية والتصريف اللمفاوي، عروض رمضان والأعياد، والإنفوجرافيك الطبي. اضغط لعرض كل التصاميم معاً داخل الموقع.",
        image: "public/assets/aistudio/image_20261101_184903.jpg_9c802ebf_2K_e23c5eaf.jpg",
        showcase: {
            mode: "posters",
            backdrop: "public/assets/aistudio/image_20261101_184903.jpg_9c802ebf_2K_e23c5eaf.jpg",
            left: "public/assets/aistudio/________________________________________9d15bc8d.png",
            center: "public/assets/aistudio/___________________________________7af432b0.png",
            right: "public/assets/aistudio/Creating_clinic_graphic_poster_8fa9cea4_2K_b3902490.jpg"
        },
        link: "#projects",
        category: "graphic",
        inSiteViewer: {
            type: "gallery",
            items: [
                { src: "public/assets/aistudio/___________________________________7af432b0.png", title: "Clinic Services, Devices & Pricing Banner", title_ar: "البوستر الرئيسي لخدمات المجمع والأجهزة والأسعار" },
                { src: "public/assets/aistudio/image_20261101_184903.jpg_9c802ebf_2K_e23c5eaf.jpg", title: "Ramadan Offers & Free Consultations Campaign", title_ar: "حملة تخفيضات رمضان المبارك والاستشارات المجانية" },
                { src: "public/assets/aistudio/Creating_clinic_graphic_poster_8fa9cea4_2K_b3902490.jpg", title: "Welcome to Umm Al-Qura Medical Complex", title_ar: "تصميم ترحيبي: أهلاً بكم في مجمع أم القرى الطبي" },
                { src: "public/assets/aistudio/image_20261101_192514_1_e1b3e180.jpg", title: "Premium Healthcare Arrival Campaign", title_ar: "رعاية صحية راقية — قرارك اليوم راحتك غداً" },
                { src: "public/assets/aistudio/image_20261101_202708_b39495e0.jpg", title: "Clinic Reception Welcome Poster", title_ar: "بوستر استقبال: أهلاً بكم.. هنا أم القرى" },
                { src: "public/assets/aistudio/image_20261101_230622_f24800f4.jpg", title: "About Us Clinic Identity Overview", title_ar: "تعريف بالمركز: من نحن؟ (مجمع أم القرى الطبي)" },
                { src: "public/assets/aistudio/image_20261101_230612_5f9aed0f.jpg", title: "Emergency & Direct Clinic Contact Flyer", title_ar: "تصميم طوارئ وتواصل ومواعيد العمل" },
                { src: "public/assets/aistudio/image_20261101_192511_a243fec7.jpg", title: "Working Hours Schedule Card", title_ar: "بطاقة أوقات العمل الرسمية من السبت للخميس" },
                { src: "public/assets/aistudio/________________________________________9d15bc8d.png", title: "Sports Injuries Rehabilitation Program", title_ar: "برنامج الإصابات الرياضية والتأهيل الآمن" },
                { src: "public/assets/aistudio/image_20261101_184409_d0387576.jpg", title: "Athletes Recovery Program Campaign", title_ar: "تصميم تأهيل الرياضيين: إصابتك الرياضية ما توقف مسيرتك" },
                { src: "public/assets/aistudio/Creating_Arabic_sports_therapy_p__0943a71c_2a5a7da3.jpg", title: "Sports Physiotherapy Vertical Ad", title_ar: "إعلان عمودي لبرنامج إعادة تأهيل الإصابات الرياضية" },
                { src: "public/assets/aistudio/_______________________________baa0c62b.png", title: "Back & Neck Pain Treatment Program", title_ar: "برنامج علاج آلام الظهر والرقبة — استعد لحركتك بدون ألم" },
                { src: "public/assets/aistudio/____3bcb43ed.jpg", title: "Back & Neck Electrotherapy Program", title_ar: "تصميم تأهيل آلام الظهر والرقبة بالتحفيز الكهربائي" },
                { src: "public/assets/aistudio/3D_infographic_showing_spinal_st__4ca7ff74_2K_ec7eede1.jpg", title: "3D Spinal & Joint Pain Conditions Infographic", title_ar: "إنفوجرافيك ثلاثي الأبعاد لآلام العمود الفقري والمفاصل" },
                { src: "public/assets/aistudio/Corporate_health_graphic_poster_4074069a_7586cdab.jpg", title: "Office Ergonomics & Spine 3D Infographic", title_ar: "إنفوجرافيك المكتب والعمود الفقري لسلامة الموظفين" },
                { src: "public/assets/aistudio/image_20261101_184903_1_afcafd18.jpg", title: "Office Workers Back Pain Prevention", title_ar: "حملة قوامك هو درعك للوقاية من آلام الظهر المكتبية" },
                { src: "public/assets/aistudio/image_20261101_184408_1_c5c81286.jpg", title: "Healthy Spine for Office Workers", title_ar: "برنامج صحة العمود الفقري للموظف العُماني" },
                { src: "public/assets/aistudio/Medical_promo_poster_design_d53394f1_2K_3c8593fc.jpg", title: "Corporate Employee Wellness Campaign", title_ar: "تصميم برنامج عافية الموظفين للشركات والمؤسسات" },
                { src: "public/assets/aistudio/image_20261101_184408_7925b290.jpg", title: "Movement & Weight Loss Program", title_ar: "تصميم برنامج الحركة وإنقاص الوزن والصحة العامة" },
                { src: "public/assets/aistudio/___________________________________0b114b22.png", title: "Knee & Osteoarthritis Rehabilitation Program", title_ar: "برنامج الركبة والخشونة — حركة أسهل لحياة أفضل" },
                { src: "public/assets/aistudio/Knee_joint_medical_comparison_bb38c419_2K_90a3c939.jpg", title: "3D Knee Joint Anatomy Comparison Visual", title_ar: "تصميم مقارن ثلاثي الأبعاد لصحة مفصل الركبة" },
                { src: "public/assets/aistudio/Medical_graphic_design_for_clinic_4e4d0057_2K_e850a3ec.jpg", title: "Therapeutic Ultrasound & Knee Care Poster", title_ar: "بوستر جهاز الموجات فوق الصوتية وعلاج الركبة" },
                { src: "public/assets/aistudio/image_20261101_184415_030556dc.jpg", title: "Frozen Shoulder Physiotherapy Campaign", title_ar: "حملة علاج تيبّس وتجمّد الكتف: كتفك متجمد؟ نذوّبه" },
                { src: "public/assets/aistudio/___________________________________9eb85bd4.png", title: "Shoulder Mobility & Rehabilitation Program", title_ar: "برنامج تأهيل مشكلات الكتف في عُمان" },
                { src: "public/assets/aistudio/image_20261101_184406_1_fdca82ad.jpg", title: "Post-Surgery Physical Rehabilitation Banner", title_ar: "برنامج التأهيل بعد العمليات: بعد العملية نرجعك تمشي أقوى" },
                { src: "public/assets/aistudio/Creating_physical_therapy_poster__0dad641d_2K_f6041be2.jpg", title: "Post-Op Medical Recommendations Program", title_ar: "برامج تأهيل ما بعد الجراحة مخصصة وفق توصيات طبية" },
                { src: "public/assets/aistudio/1_a1e5582f.jpg", title: "Knee Post-Surgery Progressive Recovery", title_ar: "بنر برنامج إعادة التأهيل بعد جراحة الركبة" },
                { src: "public/assets/aistudio/image_20261101_184406_8f079171.jpg", title: "Seniors Balance & Mobility Care", title_ar: "برنامج رعاية وتأهيل كبار السن: كبارنا.. مشيتهم عزنا" },
                { src: "public/assets/aistudio/image_20261101_184407_44c3199b.jpg", title: "Post-Stroke Neurological Recovery Hope", title_ar: "حملة التأهيل بعد الجلطة: الأمل يرجع الحركة" },
                { src: "public/assets/aistudio/______________________________-1_0b9a7056.png", title: "Integrated Neuro Rehab Series (1/4)", title_ar: "برنامج التأهيل العصبي المتكامل (الجزء الأول)" },
                { src: "public/assets/aistudio/____________________________-4_c30ada3d.png", title: "Comprehensive Neuro Rehab Exercises", title_ar: "برنامج التأهيل العصبي الشامل والتمارين الوظيفية" },
                { src: "public/assets/aistudio/Shockwave_therapy_on_knee_7d1525f8-edited_cd79ebc8.jpg", title: "Knee Shockwave Therapy Technology Ad", title_ar: "تصميم تقنية العلاج بالموجات التصادمية للركبة" },
                { src: "public/assets/aistudio/Arabic_medical_graphic_design_po__d6fb1dcb_2K_4746d65f.jpg", title: "Shockwave Therapy Chronic Pain Relief", title_ar: "بوستر العلاج بالموجات التصادمية للآلام المزمنة" },
                { src: "public/assets/aistudio/image_20261101_184909_30f780a4.jpg", title: "Plantar Fasciitis Shockwave Campaign", title_ar: "حملة علاج آلام الكعب المزمنة بالموجات التصادمية" },
                { src: "public/assets/aistudio/image_20261101_184918_773e0020.jpg", title: "Combined Electro & Ultrasound Therapy", title_ar: "تصميم العلاج المزدوج: كهرباء تشفي وموجات ترخي" },
                { src: "public/assets/aistudio/image_20261101_184903_69bda125.jpg", title: "Lymphatic Drainage Therapy Device", title_ar: "إعلان جهاز التنشيط اللمفاوي وتقليل احتباس السوائل" },
                { src: "public/assets/aistudio/Arabic_wellness_graphic_poster_d__aed8af39_2K_669109a5.jpg", title: "Modern Lymphatic Drainage & Detox Care", title_ar: "بوستر جهاز التصريف اللمفاوي الحديث" },
                { src: "public/assets/aistudio/image_20261101_192514_db4742d1.jpg", title: "Women's Pelvic Health Physiotherapy", title_ar: "تصميم صحة الحوض للمرأة — قوة وراحة" },
                { src: "public/assets/aistudio/image_20261101_192513_0f7e39d3.jpg", title: "Verified Patient Recovery Testimonial Card", title_ar: "تصميم شهادة وتجربة مريض: رجعت أمشي بدون ألم بعد 5 جلسات" },
                { src: "public/assets/aistudio/image_20261101_231539_dcf3bd70.jpg", title: "Omani National Day Greeting Poster", title_ar: "تصميم تهنئة اليوم الوطني العُماني — عُمان فخرنا" },
                { src: "public/assets/aistudio/image_20261101_231541_da5d61a0.jpg", title: "Ramadan Kareem Clinic Hours Banner", title_ar: "بنر تهنئة رمضان كريم ومواعيد المجمع" },
                { src: "public/assets/aistudio/image_20261101_231543_e28a2381.jpg", title: "Eid Al-Fitr Clinic Greeting Card", title_ar: "تصميم تهنئة عيد فطر مبارك ومواعيد العودة" },
                { src: "public/assets/aistudio/image_20261101_231532_d596d47b.jpg", title: "Eid Al-Adha Clinic Greeting Card", title_ar: "تصميم تهنئة عيد أضحى مبارك" }
            ]
        }
    },
    {
        title: "Umm Al-Qura Medical Complex — Motion Graphics & Medical Video Suite (7 Videos)",
        title_ar: "مجمع أم القرى الطبي (عُمان) — أعمال الموشن جرافيك والفيديوهات الطبية (7 فيديوهات)",
        desc: "Complete motion graphics and Reels video production for Umm Al-Qura Medical Complex (Mr. Ahmed's project in Oman) — featuring 2 full 16:9 strategic presentations alongside 5 vertical 9:16 social Reels. All 7 videos play directly inside the site.",
        desc_ar: "إنتاج متكامل لأعمال الموشن جرافيك والفيديوهات التوعوية والتسويقية لمجمع أم القرى الطبي في سلطنة عُمان — يضم عرضين موشن استراتيجيين بمقاس 16:9 بالإضافة إلى 5 فيديوهات ريلز عمودية 9:16 للسوشيال ميديا. جميع الفيديوهات تعمل مباشرة من داخل الموقع.",
        image: "assets/img/motion_thumb_1.jpg",
        showcase: {
            mode: "motion",
            backdrop: "assets/img/motion_thumb_2.jpg",
            main: "assets/img/motion_thumb_1.jpg",
            reelFront: "assets/img/motion_thumb_7.jpg",
            reelBack: "assets/img/motion_thumb_5.jpg"
        },
        link: "#projects",
        category: "motion",
        inSiteViewer: {
            type: "videos",
            items: [
                {
                    src: "public/assets/aistudio/__________________________827c1adc.mp4",
                    portrait: false,
                    duration: "05:53 · 16:9",
                    title: "Umm Al-Qura Complex — Clinic Development Roadmap",
                    title_ar: "تطوير مجمع أم القرى الطبي — الخطة التطويرية الشاملة",
                    desc: "Strategic motion presentation detailing service upgrades, patient journey improvements, and marketing workflows.",
                    desc_ar: "عرض مرئي استراتيجي يستعرض خطوات تطوير جودة الخدمات ورحلة المريض وتحديث المحتوى البصري بالمجمع."
                },
                {
                    src: "public/assets/aistudio/___________________________7da86360.mp4",
                    portrait: false,
                    duration: "06:01 · 16:9",
                    title: "Umm Al-Qura Complex — Rehabilitation & Therapy Guide",
                    title_ar: "مجمع أم القرى — تأهيل وعلاج متكامل",
                    desc: "Educational motion film explaining specialized physical therapy programs, devices, and recovery milestones.",
                    desc_ar: "فيديو موشن تعريفي يشرح برامج التأهيل الحركي والعصبي وأحدث الأجهزة العلاجية المستخدمة في المجمع."
                },
                {
                    src: "public/assets/aistudio/__________________________________________19962a9b.mp4",
                    portrait: true,
                    duration: "01:36 · 9:16 Reels",
                    title: "Visual Upgrade Plan for Physiotherapy Centers (Reels)",
                    title_ar: "خطة الارتقاء البصري لمراكز العلاج الطبيعي (ريلز)",
                    desc: "Vertical Reels motion production combining 3D biomechanics visuals, quiz frames, and branded Arabic storytelling.",
                    desc_ar: "فيديو موشن جرافيك عمودي (Reels) يبرز خطة الارتقاء بالهوية البصرية لمراكز العلاج الطبيعي بأسلوب تفاعلي سريع."
                },
                {
                    src: "public/assets/aistudio/___________________________________________8927d25a.mp4",
                    portrait: true,
                    duration: "01:28 · 9:16 Reels",
                    title: "How to Regain Pain-Free Movement at Umm Al-Qura",
                    title_ar: "كيف تستعيد حركتك بدون ألم في مجمع أم القرى",
                    desc: "Patient-centric Reels video simplifying structured physiotherapy sessions from assessment to full mobility.",
                    desc_ar: "فيديو ريلز توعوي يشرح رحلة التعافي واستعادة الحركة بدون ألم داخل أقسام العلاج الطبيعي بالمجمع."
                },
                {
                    src: "public/assets/aistudio/________________________________________2158de63.mp4",
                    portrait: true,
                    duration: "01:32 · 9:16 Reels",
                    title: "Non-Surgical Spinal Disc Decompression Explained",
                    title_ar: "كيف يعالج الشد الفقري الديسك بدون جراحة",
                    desc: "3D anatomical motion explainer breaking down how spinal decompression relieves disc pressure without surgery.",
                    desc_ar: "موشن جرافيك طبي يشرح آلية علاج الديسك والغضروف بجهاز الشد الفقري بدون تدخل جراحي."
                },
                {
                    src: "public/assets/aistudio/Um_Alqura_Client_Reviews_a88d697f.mp4",
                    portrait: true,
                    duration: "01:29 · 9:16 Reels",
                    title: "Umm Al-Qura Patient Reviews & Success Stories",
                    title_ar: "آراء وتجارب مراجعي مجمع أم القرى الطبي",
                    desc: "Social-proof vertical showcase highlighting authentic client feedback, trust signals, and clinical outcomes.",
                    desc_ar: "فيديو موشن لاستعراض آراء المراجعين وتجارب التحسن الفعلية بعد جلسات التأهيل بالمجمع."
                },
                {
                    src: "public/assets/aistudio/4_424c9953.mp4",
                    portrait: true,
                    duration: "01:17 · 9:16 Reels",
                    title: "3D Paper-Craft Tour Inside Umm Al-Qura Clinic — Oman",
                    title_ar: "جولة إبداعية ثلاثية الأبعاد داخل مجمع أم القرى — عُمان",
                    desc: "Creative 3D miniature animation welcoming visitors across Oman into the physical therapy & rehab wing.",
                    desc_ar: "فيديو موشن بتصميم ثلاثي الأبعاد مُصغّر يأخذ المشاهد من خريطة سلطنة عُمان في جولة داخل صالات العلاج الطبيعي بالمجمع."
                }
            ]
        }
    },
    {
        title: "Mr. Ahmed's Oman Project — Brand Identity, Location Maps & UI Assets",
        title_ar: "مشروع أ. أحمد في عُمان — الهوية البصرية، خرائط الموقع وأيقونات المجمع",
        desc: "Complete brand identity boards, official Barka clinic location maps, patient assessment & booking workflow visuals, and custom UI icons — all viewable directly inside this page.",
        desc_ar: "الحزمة المتكاملة للهوية البصرية لمشروع أ. أحمد (مجمع أم القرى الطبي — سلطنة عُمان): تضم لوحات الهوية البصرية الكاملة، خرائط الموقع في بركاء، مخططات التقييم والحجز، وأيقونات الواجهة المصممة خصيصاً للمشروع — تفتح كلها داخل الموقع مباشرة.",
        image: "public/assets/aistudio/image_20261101_183712-edited_d047b3f0.jpg",
        showcase: {
            mode: "branding",
            backdrop: "public/assets/aistudio/image_20261101_184904_d70344ed.jpg",
            map: "public/assets/aistudio/image_20261101_183712-edited_d047b3f0.jpg",
            identity: "public/assets/aistudio/Medical_clinic_brand_identity_gu__633e1cb2_e9c284cd.jpg",
            icons: [
                "public/assets/aistudio/about_us_icon_88588145.png",
                "public/assets/aistudio/medical_services_icon_c6d48930.png",
                "public/assets/aistudio/emergency_icon_54c31878.png",
                "public/assets/aistudio/patient_reviews_icon_fc1ba57a.png"
            ]
        },
        link: "#projects",
        category: "branding",
        inSiteViewer: {
            type: "hub",
            brandSheets: [
                { src: "public/assets/aistudio/Medical_clinic_brand_identity_gu__633e1cb2_e9c284cd.jpg", title: "Full Brand Identity System (Logo, Palette, Typography & Values)", title_ar: "نظام الهوية البصرية الكامل (الشعار، الألوان، الخطوط، القيم)" },
                { src: "public/assets/aistudio/Medical_clinic_brand_guideline_p__9b8da835_6cc32eca.jpg", title: "Clinic Brand Guidelines & Visual Application Board", title_ar: "دليل تطبيقات الهوية البصرية للمجمع الطبي" },
                { src: "public/assets/aistudio/image_20261101_183712-edited_d047b3f0.jpg", title: "Official Clinic Location Map & Directory — Barka, Oman", title_ar: "خريطة الموقع الرسمية والدليل الطبي — بركاء، سلطنة عُمان" },
                { src: "public/assets/aistudio/image_20261101_184904_d70344ed.jpg", title: "Illustrated Exterior Map Poster (Barka Public Street)", title_ar: "تصميم الخريطة التوضيحية لموقع المجمع: موقعنا ما يتوه" },
                { src: "public/assets/aistudio/image_20261101_184900_1_dc18a2ef.jpg", title: "3-Stage Comprehensive Patient Assessment Diagram", title_ar: "إنفوجرافيك خطوات التقييم الطبي الشامل (3 مراحل)" },
                { src: "public/assets/aistudio/image_20261101_184900_057d84bf.jpg", title: "3-Step WhatsApp & Consultation Booking Process", title_ar: "إنفوجرافيك خطوات الحجز السريع والاستشارة: احجز في دقيقة" }
            ],
            icons: [
                { src: "public/assets/aistudio/about_us_icon_88588145.png", title: "About Us Custom Clinic Icon", title_ar: "أيقونة مَن نحن" },
                { src: "public/assets/aistudio/medical_services_icon_c6d48930.png", title: "Medical Services Custom Emblem", title_ar: "أيقونة خدماتنا الطبية" },
                { src: "public/assets/aistudio/emergency_icon_54c31878.png", title: "Emergency Care Custom Badge", title_ar: "أيقونة الطوارئ والتواصل" },
                { src: "public/assets/aistudio/patient_reviews_icon_fc1ba57a.png", title: "Patient Reviews Custom Badge", title_ar: "أيقونة آراء وتجارب المرضى" }
            ]
        }
    },
    {
        title: "Egypt DXN Store — WooCommerce Platform",
        title_ar: "متجر DXN مصر - متجر ووكومرس (عميل سعودي)",
        desc: "A complete WooCommerce e-commerce platform built for a client in Saudi Arabia. Designed, developed, and currently fully managed, maintained, and updated by me.",
        desc_ar: "متجر إلكتروني متكامل بنظام WooCommerce لعميل في المملكة العربية السعودية. قمت بتصميمه وتطويره بالكامل، وأتولى الإدارة الشاملة، الصيانة الدورية، التحديثات والمتابعة الفنية المستمرة للمتجر حتى الآن.",
        image: "assets/img/covers/egypt-dxn-store.svg",
        link: "https://egyptdxnstore.com/",
        category: "wordpress"
    },
    {
        title: "Mastery Funnel — Sales & Marketing Platform",
        title_ar: "ماستري فنل - منصة تسويق ومسارات مبيعات",
        desc: "A professional WordPress website built for the same Saudi client, optimized for sales funnels, high conversions, speed, and seamless lead generation.",
        desc_ar: "موقع ووردبريس احترافي لنفس العميل السعودي، متخصص في مسارات المبيعات (Sales Funnels) والحلول التسويقية. تم بناؤه بأعلى معايير السرعة والتجاوب وتحويل الزوار إلى عملاء.",
        image: "assets/img/covers/mastery-funnel.svg",
        link: "https://masteryfunnel.com/",
        category: "wordpress"
    },
    {
        title: "Nurse Mona Kamel — Professional Portfolio",
        title_ar: "بورتفوليو احترافي للممرضة منى كامل",
        desc: "A dedicated personal portfolio website designed and developed for Nurse Mona Kamel to present professional healthcare credentials, medical services, and clinical experience.",
        desc_ar: "تصميم وتطوير موقع بورتفوليو شخصي احترافي للممرضة منى كامل لعرض الخبرات الطبية والمؤهلات والخدمات التمريضية بأسلوب بصري منظم وعصري يعكس الاحترافية.",
        image: "assets/img/nurse-ai.png",
        link: "https://fatmaana1234.github.io/mona_kamel/",
        category: "wordpress"
    },
    {
        title: "Customer Service Representative Portfolio",
        title_ar: "بورتفوليو أخصائي خدمة العملاء والدعم الرقمي",
        desc: "My professional portfolio showcasing key skills, expertise, and strategies in customer relationship management, effective communication, and digital client support.",
        desc_ar: "موقع بورتفوليو شخصي مصمم خصيصاً لعرض مهاراتي وخبراتي الاحترافية في مجالات خدمة العملاء، التواصل الفعال، الدعم الفني، وإدارة علاقات العملاء بأسلوب تفاعلي وجذاب.",
        image: "assets/img/portfolio-ai.png",
        link: "https://fatmaana1234.github.io/customer-service/",
        category: "wordpress"
    },
    {
        title: "Smart Scientists 2026",
        title_ar: "رحلة عبر الزمن مع علماء المسلمين",
        desc: "An interactive educational platform introducing students to the contributions of Muslim scientists throughout history.",
        desc_ar: "منصة تعليمية تهدف لتعريف الطلاب بإسهامات علماء المسلمين عبر التاريخ بأسلوب تفاعلي.",
        image: "assets/img/smart_scientists_ui_1778252949835.png",
        link: "https://sites.google.com/view/smart-scientists-2026/%D8%A7%D9%84%D8%B5%D9%81%D8%AD%D8%A9-%D8%A7%D9%84%D8%B1%D8%A6%D9%8A%D8%B3%D9%8A%D8%A9",
        category: "wordpress"
    },
    {
        title: "Journey of Heroes",
        title_ar: "رحلة الأبطال في عالم الجمال والآداب",
        desc: "An educational project that instills beautiful manners and moral values in young people.",
        desc_ar: "مشروع تعليمي قيمي يهدف لغرس الآداب الجميلة والقيم الأخلاقية في نفوس الناشئة.",
        image: "assets/img/journey_heroes_ui_1778253140090.png",
        link: "https://sites.google.com/view/journey-of-heroes-in-the-world/%D8%A7%D9%84%D8%B1%D8%A6%D9%8A%D8%B3%D9%8A%D8%A9-%D8%A7%D9%86%D8%B7%D9%84%D8%A7%D9%82-%D8%A7%D9%84%D8%B1%D8%AD%D9%84%D8%A9",
        category: "wordpress"
    },
    {
        title: "Health Hero Academy",
        title_ar: "أكاديمية بطل الصحة (مغامرة الحياة الصحية)",
        desc: "A platform teaching kids healthy habits and proper nutrition through fun adventures.",
        desc_ar: "منصة تهدف لتعليم الأطفال العادات الصحية السليمة والتغذية المفيدة من خلال مغامرات ممتعة.",
        image: "assets/img/health_hero_ui_1778253153287.png",
        link: "https://sites.google.com/view/health-hero-academy-/home-page-start-here",
        category: "wordpress"
    },
    {
        title: "Science Hero 2026",
        title_ar: "بطل العلوم: رحلة في عالم المادة",
        desc: "Simplifying science and physics concepts for young explorers in an engaging, experimental way.",
        desc_ar: "تبسيط مفاهيم العلوم والفيزياء للمستكشف الصغير بأسلوب مشوق وتجريبي.",
        image: "assets/img/science_hero_ui_1778253379691.png",
        link: "https://sites.google.com/view/science-hero-2026/%D8%A7%D9%84%D8%B5%D9%81%D8%AD%D8%A9-%D8%A7%D9%84%D8%B1%D8%A6%D9%8A%D8%B3%D9%8A%D8%A9",
        category: "wordpress"
    },
    {
        title: "Fun English Learning Series",
        title_ar: "سلسلة تعلم الإنجليزية الممتعة",
        desc: "An educational video that simplifies English grammar and vocabulary for beginners.",
        desc_ar: "فيديو تعليمي يهدف لتبسيط قواعد ومفردات اللغة الإنجليزية للمبتدئين.",
        image: "assets/img/covers/english-series.svg",
        link: "https://drive.google.com/file/d/1bf2efrCZKlenyns5MbQY-QZIOX7wz7GL/view?usp=sharing",
        category: "english"
    },
    {
        title: "English Learning — Part 4",
        title_ar: "تعلم الإنجليزية - الجزء الرابع",
        desc: "Continuation of the interactive English learning series to boost listening and pronunciation skills.",
        desc_ar: "استكمال لسلسلة دروس اللغة الإنجليزية التفاعلية لتعزيز مهارات الاستماع والنطق.",
        image: "assets/img/covers/english-part4.svg",
        link: "https://drive.google.com/file/d/14XB4cpFs-gkePKS_YanoB4wMX-3OMh-j/view?usp=sharing",
        category: "english"
    },
    {
        title: "English Learning — Part 3",
        title_ar: "تعلم الإنجليزية - الجزء الثالث",
        desc: "An advanced lesson in everyday English conversation skills.",
        desc_ar: "درس متقدم في مهارات المحادثة واللغة الإنجليزية اليومية.",
        image: "assets/img/covers/english-part3.svg",
        link: "https://drive.google.com/file/d/1xqBJJD_trhGlycUAHcOUfhdR4hocOaaQ/view?usp=sharing",
        category: "english"
    },
    {
        title: "English Learning — Part 2",
        title_ar: "تعلم الإنجليزية - الجزء الثاني",
        desc: "A solid foundation in essential English grammar, simplified.",
        desc_ar: "تأسيس قوي في قواعد اللغة الإنجليزية الأساسية بأسلوب مبسط.",
        image: "assets/img/covers/english-part2.svg",
        link: "https://drive.google.com/file/d/1MA_eLqWRYjchUT8-F4Wkvjtdz_PQCcjv/view?usp=sharing",
        category: "english"
    },
    {
        title: "Health Heroes Camp Adventures",
        title_ar: "مغامرات معسكر أبطال الصحة",
        desc: "An animated video promoting physical activity and vitality for children.",
        desc_ar: "فيديو حركي يهدف لتعزيز النشاط البدني والحيوية لدى الأطفال.",
        image: "assets/img/covers/health-camp.svg",
        link: "https://drive.google.com/file/d/13L93OX0y-YlrzBbAs877Upe_o_dRP7U0/view?usp=sharing",
        category: "health"
    },
    {
        title: "Healthy Life Guide (English)",
        title_ar: "دليل الحياة الصحية (English Guide)",
        desc: "An educational file linking English learning with essential health concepts.",
        desc_ar: "ملف تعليمي يربط بين تعلم اللغة الإنجليزية والمفاهيم الصحية الأساسية.",
        image: "assets/img/covers/health-life-guide.svg",
        link: "https://drive.google.com/file/d/19DaMioNm2g6LBheM6LraIt-fl6fRprvr/view?usp=sharing",
        category: "health"
    },
    {
        title: "World of Social Studies",
        title_ar: "عالم الدراسات الاجتماعية",
        desc: "An educational video introducing students to history and geography in a storytelling style.",
        desc_ar: "فيديو تعليمي يهدف لتعريف الطلاب بالتاريخ والجغرافيا بأسلوب قصصي.",
        image: "assets/img/covers/social-world.svg",
        link: "https://drive.google.com/file/d/1t5MHmL4pstdSdltSp-0rzeE5N88brjxJ/view?usp=sharing",
        category: "social"
    },
    {
        title: "Social Studies — Part 3",
        title_ar: "الدراسات الاجتماعية - الجزء الثالث",
        desc: "A journey through the history and civilizations of the world via an engaging educational video.",
        desc_ar: "رحلة معرفية في تاريخ وحضارات العالم من خلال فيديو تعليمي مشوق.",
        image: "assets/img/covers/social-part3.svg",
        link: "https://drive.google.com/file/d/1U3bWtzUEDqjMQs3RqK7K5bn-4vIXFNem/view?usp=sharing",
        category: "social"
    },
    {
        title: "Social Studies — Part 2",
        title_ar: "الدراسات الاجتماعية - الجزء الثاني",
        desc: "Strengthening national values and geographical awareness among students visually.",
        desc_ar: "تعزيز القيم الوطنية والوعي الجغرافي لدى الطلاب بأسلوب مرئي.",
        image: "assets/img/covers/social-part2.svg",
        link: "https://drive.google.com/file/d/16cTCTfofl1cgnRCcJwg_m1oGRkcOgj-f/view?usp=sharing",
        category: "social"
    },
    {
        title: "Our Beautiful Manners (Saudi Style)",
        title_ar: "آدابنا الجميلة (النمط السعودي)",
        desc: "A video promoting national identity and social etiquette prevalent in the Kingdom.",
        desc_ar: "فيديو يهدف لتعزيز الهوية الوطنية والآداب الاجتماعية السائدة في المملكة.",
        image: "assets/img/covers/social-saudi-manners.svg",
        link: "https://drive.google.com/file/d/11KGDjBBigrb6oE4q75TCKqC4ss3SUWBG/view?usp=sharing",
        category: "social"
    },
    {
        title: "Islamic Studies Adventures",
        title_ar: "مغامرات الدراسات الإسلامية",
        desc: "An interactive file instilling Islamic values and morals through stories and activities.",
        desc_ar: "ملف تفاعلي يهدف لغرس القيم والأخلاق الإسلامية من خلال قصص وأنشطة.",
        image: "assets/img/covers/islamic-adventures.svg",
        link: "https://drive.google.com/file/d/1Y-nad8dno_w64_--ZGjLfgcx-CT-Hrdn/view?usp=sharing",
        category: "islamic"
    },
    {
        title: "Arabic Language Masterpieces",
        title_ar: "روائع اللغة العربية",
        desc: "An educational video simplifying Arabic grammar and fostering a love of reading.",
        desc_ar: "فيديو تعليمي يهدف لتبسيط قواعد اللغة العربية وحب القراءة.",
        image: "assets/img/covers/arabic-masterpieces.svg",
        link: "https://drive.google.com/file/d/1sCX3SrvIkyzML_1Wo9qFxgEDo1Lh-iFB/view?usp=sharing",
        category: "arabic"
    },
    {
        title: "Arabic Language — Review & Reinforcement",
        title_ar: "اللغة العربية - مراجعة وتعزيز",
        desc: "A video focusing on writing and spelling skills in an interactive style.",
        desc_ar: "فيديو يركز على مهارات الكتابة والإملاء بأسلوب تفاعلي.",
        image: "assets/img/covers/arabic-review.svg",
        link: "https://drive.google.com/file/d/1328QaGOXBmVOzpi245s262O7cD1kTF6Y/view?usp=sharing",
        category: "arabic"
    },
    {
        title: "Arabic Language — Level 2",
        title_ar: "اللغة العربية - المستوى الثاني",
        desc: "Developing expression and reading comprehension skills through rich visual content.",
        desc_ar: "تطوير مهارات التعبير والفهم القرائي من خلال محتوى مرئي غني.",
        image: "assets/img/covers/arabic-level2.svg",
        link: "https://drive.google.com/file/d/19NGxAlHVpMshAkQ8-ZHD9GYoEsnXQAbk/view?usp=sharing",
        category: "arabic"
    },
    {
        title: "Gateway to Muslim Scientists",
        title_ar: "بوابة علماء المسلمين الاستكشافية",
        desc: "A visual tour highlighting the genius of Arab and Muslim scientists and their inventions.",
        desc_ar: "جولة مرئية تهدف لإبراز عبقرية العلماء العرب والمسلمين واختراعاتهم.",
        image: "assets/img/covers/science-gateway-muslim.svg",
        link: "https://drive.google.com/file/d/14sDe7FHIAk0NSvCPVkLu9NlwEO6oEVpA/view?usp=sharing",
        category: "science"
    },
    {
        title: "Jabir ibn Hayyan & The Magic Paper",
        title_ar: "جابر بن حيان والورق السحري",
        desc: "An illustrated scientific story introducing children to the achievements of chemist Jabir ibn Hayyan.",
        desc_ar: "قصة علمية مصورة تهدف لتعريف الأطفال بإنجازات الكيميائي جابر بن حيان.",
        image: "assets/img/covers/science-jabir.svg",
        link: "https://drive.google.com/file/d/1Acw5fgDkzbeCkr636dj2yQFz0B2fFGm4/view?usp=sharing",
        category: "science"
    },
    {
        title: "Arab Scientists Adventures",
        title_ar: "مغامرات العلماء العرب",
        desc: "A comprehensive file documenting the history of Arabic science and inspiring the next generation.",
        desc_ar: "ملف شامل يهدف لتوثيق تاريخ العلوم العربية وإلهام الجيل القادم.",
        image: "assets/img/covers/science-arab-adventures.svg",
        link: "https://drive.google.com/file/d/1uiiD6_cfvYOB-2-aIv0W0WUHwrUY24PE/view?usp=sharing",
        category: "science"
    },
    {
        title: "Journey into the World of Science",
        title_ar: "رحلة في عالم العلوم",
        desc: "An educational video exploring natural phenomena around us in a scientific style.",
        desc_ar: "فيديو تعليمي يهدف لاستكشاف ظواهر الطبيعة من حولنا بأسلوب علمي.",
        image: "assets/img/covers/science-journey.svg",
        link: "https://drive.google.com/file/d/1OmYYSheXme3GecSbjP7XRFwXks6o0cNL/view?usp=sharing",
        category: "science"
    },
    {
        title: "Interactive Science Lab",
        title_ar: "مختبر العلوم التفاعلي",
        desc: "A video focusing on simple science experiments that can be done in the classroom.",
        desc_ar: "فيديو يركز على التجارب العلمية البسيطة التي يمكن تنفيذها في الفصل.",
        image: "assets/img/covers/science-lab.svg",
        link: "https://drive.google.com/file/d/1TenJeNksZvFCjiVLhqeqcziynrSMCasN/view?usp=sharing",
        category: "science"
    },
    {
        title: "Science — Part 3",
        title_ar: "العلوم - الجزء الثالث",
        desc: "Deepening students' understanding of science lessons through interactive visual content.",
        desc_ar: "تعميق فهم الطلاب لدروس العلوم من خلال محتوى مرئي تفاعلي.",
        image: "assets/img/covers/science-part3.svg",
        link: "https://drive.google.com/file/d/16-6ISHkIZVl7_8eAlysq9QJVX7yYXQ-U/view?usp=sharing",
        category: "science"
    },
    {
        title: "Science — Part 2",
        title_ar: "العلوم - الجزء الثاني",
        desc: "Educational content simplifying complex scientific concepts visually.",
        desc_ar: "محتوى تعليمي يهدف لتبسيط المفاهيم العلمية المعقدة بأسلوب بصري.",
        image: "assets/img/covers/science-part2.svg",
        link: "https://drive.google.com/file/d/167cVIZ_lcZD58L49aj3G_wwo0UFq1A_Q/view?usp=sharing",
        category: "science"
    },
    {
        title: "Science Adventures (Activities & Experiments)",
        title_ar: "مغامرات العلوم (أنشطة وتجارب)",
        desc: "A practical guide encouraging students to engage in scientific inquiry and research.",
        desc_ar: "دليل عملي يهدف لتشجيع الطلاب على البحث والاستقصاء العلمي.",
        image: "assets/img/covers/science-adventures-guide.svg",
        link: "https://drive.google.com/file/d/18kjnBym5bU7Rd5a1RuOnlFOBxRKkB851/view?usp=sharing",
        category: "science"
    },
    {
        title: "Math Detective Journey",
        title_ar: "رحلة المحقق الرياضي",
        desc: "A presentation simplifying concepts of grouping and area in mathematics.",
        desc_ar: "عرض تقديمي يهدف لتبسيط مفاهيم التجميع والمساحة في الرياضيات.",
        image: "assets/img/covers/math-detective.svg",
        link: "https://docs.google.com/presentation/d/1Qi2RMMvFOZ5yYOYDU7ijli82Ggl0g2oJ/edit?usp=sharing",
        category: "math"
    },
    {
        title: "Illustrative Math Tool",
        title_ar: "وسيلة الرياضيات الإيضاحية",
        desc: "A visual tool enhancing geometric and mathematical understanding for students.",
        desc_ar: "أداة بصرية تهدف لتعزيز الفهم الهندسي والرياضي لدى الطلاب.",
        image: "assets/img/covers/math-illustrative.svg",
        link: "https://drive.google.com/file/d/1rWPJFscc9Wz3WS0kKSwopY8t4Zr1nn36/view?usp=sharing",
        category: "math"
    },
    {
        title: "Grade 3 Primary Math",
        title_ar: "رياضيات الصف الثالث الابتدائي",
        desc: "An interactive lesson to learn area calculation and the grouping property smartly.",
        desc_ar: "درس تفاعلي يهدف لتعلم حساب المساحة وخاصية التجميع بذكاء.",
        image: "assets/img/covers/math-grade3.svg",
        link: "https://docs.google.com/presentation/d/13HBsXSM9_UZhYdB0Q_DOups_TMiYzTc_/edit?usp=sharing",
        category: "math"
    },
    {
        title: "Math Essentials",
        title_ar: "أساسيات الرياضيات",
        desc: "An educational tool simplifying basic arithmetic operations.",
        desc_ar: "وسيلة تعليمية تهدف لتبسيط العمليات الحسابية الأساسية.",
        image: "assets/img/covers/math-essentials.svg",
        link: "https://drive.google.com/file/d/12xWq7_V4cxLIvWhJaIRJFE4VFWUJ2BDg/view?usp=sharing",
        category: "math"
    },
    {
        title: "Basic Geometry",
        title_ar: "الهندسة والمساحة",
        desc: "A visual explanation simplifying geometric concepts and area measurement.",
        desc_ar: "شرح مرئي يهدف لتبسيط المفاهيم الهندسية وقياس المساحات.",
        image: "assets/img/covers/math-geometry.svg",
        link: "https://drive.google.com/file/d/1oF2i1ujoPTbP_Uhi2n4csY4bh6CQblcy/view?usp=sharing",
        category: "math"
    }
];

/* ==========================================================================
   In-Site Project Viewer Modal (Gallery / Video Theater / Brand & PDF Hub)
   Zero External Redirects — Everything Opens Directly Inside the Site
   ========================================================================== */
let pvLightboxItems = [];
let pvLightboxIndex = 0;

function openLightbox(items, startIndex = 0) {
    const lb = document.getElementById('pvLightbox');
    const img = document.getElementById('pvLbImg');
    const caption = document.getElementById('pvLbCaption');
    if (!lb || !img || !items || !items.length) return;

    pvLightboxItems = items;
    pvLightboxIndex = (startIndex + items.length) % items.length;
    const item = pvLightboxItems[pvLightboxIndex];
    const title = currentLang === 'ar' ? (item.title_ar || item.title) : item.title;

    img.src = encodeURI(item.src);
    img.alt = title;
    if (caption) {
        caption.textContent = `${pvLightboxIndex + 1} / ${pvLightboxItems.length} — ${title}`;
    }
    lb.classList.add('active');
    lb.setAttribute('aria-hidden', 'false');
    playSound('open');
}

function stepLightbox(delta) {
    if (!pvLightboxItems.length) return;
    openLightbox(pvLightboxItems, pvLightboxIndex + delta);
}

function closeLightbox() {
    const lb = document.getElementById('pvLightbox');
    if (!lb) return;
    lb.classList.remove('active');
    lb.setAttribute('aria-hidden', 'true');
}

function closeProjectViewer() {
    closeLightbox();
    const modal = document.getElementById('projectViewerModal');
    const body = document.getElementById('pvModalBody');
    if (!modal) return;
    modal.querySelectorAll('video').forEach(v => { try { v.pause(); } catch (_) {} });
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    if (body) body.innerHTML = '';
    document.body.style.overflow = '';
}

function openProjectViewer(proj) {
    const modal = document.getElementById('projectViewerModal');
    const kicker = document.getElementById('pvModalKicker');
    const titleEl = document.getElementById('pvModalTitle');
    const body = document.getElementById('pvModalBody');
    if (!modal || !body) return;

    const t = translations[currentLang];
    if (kicker) kicker.textContent = getProjCategoryLabel(proj.category);
    if (titleEl) titleEl.textContent = getProjTitle(proj);

    const cfg = proj.inSiteViewer || {};
    body.innerHTML = '';

    // 1. Multi-Image Graphic Design Gallery
    if (cfg.type === 'gallery' && Array.isArray(cfg.items)) {
        const items = cfg.items;
        body.innerHTML = `
            <p class="pv-intro">${getProjDesc(proj)}</p>
            <div class="pv-gallery-toolbar">
                <span>${items.length} ${t.pv_items_count}</span>
                <span>${t.pv_gallery_hint}</span>
            </div>
            <div class="pv-gallery-grid" id="pvGalleryGrid"></div>`;

        const grid = body.querySelector('#pvGalleryGrid');
        items.forEach((item, idx) => {
            const card = document.createElement('button');
            card.type = 'button';
            card.className = 'pv-gallery-item';
            const itemTitle = currentLang === 'ar' ? (item.title_ar || item.title) : item.title;
            card.innerHTML = `
                <div class="pv-gallery-thumb">
                    <img src="${encodeURI(item.src)}" alt="${itemTitle}" loading="lazy">
                </div>
                <div class="pv-gallery-caption">
                    <strong>${itemTitle}</strong>
                    <span>#${String(idx + 1).padStart(2, '0')}</span>
                </div>`;
            card.addEventListener('click', () => openLightbox(items, idx));
            grid.appendChild(card);
        });
    }
    // 2. Interactive Multi-Video Motion Graphics Theater
    else if (cfg.type === 'videos' && Array.isArray(cfg.items)) {
        const videos = cfg.items;
        body.innerHTML = `
            <p class="pv-intro">${getProjDesc(proj)}</p>
            <div class="pv-theater">
                <div class="pv-stage-card">
                    <div class="pv-video-box" id="pvVideoBox">
                        <video id="pvVideoPlayer" controls playsinline preload="metadata"></video>
                    </div>
                    <div class="pv-video-details">
                        <div class="pv-video-details-meta" id="pvVideoMeta"></div>
                        <h3 id="pvVideoTitle"></h3>
                        <p id="pvVideoDesc"></p>
                    </div>
                </div>
                <div>
                    <div style="font-size:0.85rem;font-weight:700;color:var(--clr-text-muted);margin-bottom:0.65rem;">
                        ${t.pv_video_playlist} (${videos.length})
                    </div>
                    <div class="pv-playlist" id="pvPlaylist"></div>
                </div>
            </div>`;

        const videoBox = body.querySelector('#pvVideoBox');
        const videoEl = body.querySelector('#pvVideoPlayer');
        const metaEl = body.querySelector('#pvVideoMeta');
        const vTitleEl = body.querySelector('#pvVideoTitle');
        const vDescEl = body.querySelector('#pvVideoDesc');
        const playlistEl = body.querySelector('#pvPlaylist');

        const selectVideo = (idx, autoPlay = false) => {
            const v = videos[idx];
            if (!v) return;
            videoBox.classList.toggle('is-portrait', Boolean(v.portrait));
            videoEl.pause();
            videoEl.src = encodeURI(v.src);
            videoEl.load();
            if (autoPlay) videoEl.play().catch(() => {});
            metaEl.textContent = v.duration || '';
            vTitleEl.textContent = currentLang === 'ar' ? (v.title_ar || v.title) : v.title;
            vDescEl.textContent = currentLang === 'ar' ? (v.desc_ar || v.desc) : v.desc;
            playlistEl.querySelectorAll('.pv-playlist-item').forEach((btn, bIdx) => {
                btn.classList.toggle('active', bIdx === idx);
            });
        };

        videos.forEach((v, idx) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'pv-playlist-item' + (idx === 0 ? ' active' : '');
            const vt = currentLang === 'ar' ? (v.title_ar || v.title) : v.title;
            btn.innerHTML = `
                <span class="pv-playlist-index">${String(idx + 1).padStart(2, '0')}</span>
                <span class="pv-playlist-info">
                    <strong>${vt}</strong>
                    <span>${v.duration || ''}</span>
                </span>`;
            btn.addEventListener('click', () => {
                selectVideo(idx, true);
                playSound('click');
            });
            playlistEl.appendChild(btn);
        });

        selectVideo(0, false);
    }
    // 3. Brand Identity, Location Maps & Icons Hub
    else if (cfg.type === 'hub') {
        body.innerHTML = `
            <p class="pv-intro">${getProjDesc(proj)}</p>
            <div class="pv-hub-tabs" role="tablist">
                <button type="button" class="pv-tab-btn active" data-tab="brand" role="tab">${t.pv_tab_brand} (${(cfg.brandSheets || []).length})</button>
                <button type="button" class="pv-tab-btn" data-tab="icons" role="tab">${t.pv_tab_icons} (${(cfg.icons || []).length})</button>
            </div>
            <div id="pvHubContent"></div>`;

        const hubContent = body.querySelector('#pvHubContent');
        const renderHubTab = (tabKey) => {
            hubContent.innerHTML = '';
            if (tabKey === 'brand' && Array.isArray(cfg.brandSheets)) {
                const grid = document.createElement('div');
                grid.className = 'pv-gallery-grid';
                cfg.brandSheets.forEach((item, idx) => {
                    const card = document.createElement('button');
                    card.type = 'button';
                    card.className = 'pv-gallery-item';
                    const itemTitle = currentLang === 'ar' ? (item.title_ar || item.title) : item.title;
                    card.innerHTML = `
                        <div class="pv-gallery-thumb">
                            <img src="${encodeURI(item.src)}" alt="${itemTitle}" loading="lazy">
                        </div>
                        <div class="pv-gallery-caption">
                            <strong>${itemTitle}</strong>
                            <span>#${String(idx + 1).padStart(2, '0')}</span>
                        </div>`;
                    card.addEventListener('click', () => openLightbox(cfg.brandSheets, idx));
                    grid.appendChild(card);
                });
                hubContent.appendChild(grid);
            } else if (tabKey === 'icons' && Array.isArray(cfg.icons)) {
                const grid = document.createElement('div');
                grid.className = 'pv-asset-icon-grid';
                cfg.icons.forEach((item, idx) => {
                    const card = document.createElement('button');
                    card.type = 'button';
                    card.className = 'pv-gallery-item';
                    const itemTitle = currentLang === 'ar' ? (item.title_ar || item.title) : item.title;
                    card.innerHTML = `
                        <div class="pv-asset-icon-thumb">
                            <img src="${encodeURI(item.src)}" alt="${itemTitle}" loading="lazy">
                        </div>
                        <div class="pv-gallery-caption">
                            <strong>${itemTitle}</strong>
                            <span>PNG UI Asset</span>
                        </div>`;
                    card.addEventListener('click', () => openLightbox(cfg.icons, idx));
                    grid.appendChild(card);
                });
                hubContent.appendChild(grid);
            }
        };

        body.querySelectorAll('.pv-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                body.querySelectorAll('.pv-tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderHubTab(btn.getAttribute('data-tab'));
                playSound('click');
            });
        });

        renderHubTab('brand');
    }
    // 4. Generic single local video/PDF/image fallback (stays inside site)
    else if (proj.link && proj.link.toLowerCase().endsWith('.pdf')) {
        body.innerHTML = `
            <p class="pv-intro">${getProjDesc(proj)}</p>
            <div class="pv-pdf-shell">
                <iframe class="pv-pdf-frame" src="${encodeURI(proj.link)}#view=FitH" title="${getProjTitle(proj)}"></iframe>
            </div>`;
    } else if (proj.link && proj.link.toLowerCase().endsWith('.mp4')) {
        body.innerHTML = `
            <p class="pv-intro">${getProjDesc(proj)}</p>
            <div class="pv-stage-card">
                <div class="pv-video-box">
                    <video controls autoplay playsinline src="${encodeURI(proj.link)}"></video>
                </div>
            </div>`;
    }

    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    playSound('open');
}

function setupProjectViewerModal() {
    const closeBtn = document.getElementById('pvCloseBtn');
    const backdrop = document.getElementById('pvBackdrop');
    const lbClose = document.getElementById('pvLbClose');
    const lbPrev = document.getElementById('pvLbPrev');
    const lbNext = document.getElementById('pvLbNext');
    const lb = document.getElementById('pvLightbox');

    closeBtn?.addEventListener('click', closeProjectViewer);
    backdrop?.addEventListener('click', closeProjectViewer);
    lbClose?.addEventListener('click', closeLightbox);
    lbPrev?.addEventListener('click', () => stepLightbox(-1));
    lbNext?.addEventListener('click', () => stepLightbox(1));
    lb?.addEventListener('click', (e) => {
        if (e.target === lb) closeLightbox();
    });
}

/* ==========================================================================
   Projects: load + render + filter + show-more
   ========================================================================== */
function normalizeCategory(cat) {
    if (!cat) return 'other';
    const c = String(cat).toLowerCase().trim();
    if (c === 'wordpress' || c === 'wp') return 'wordpress';
    if (c === 'motion_graphic') return 'motion';
    if (c === 'other') return 'other';
    return c;
}

function hasInSiteViewer(proj) {
    if (!proj) return false;
    if (proj.inSiteViewer) return true;
    const link = (proj.link || '').toLowerCase();
    return link.endsWith('.mp4') || link.endsWith('.pdf');
}

function renderLocalProjectsFallback() {
    allProjectsCache = [...myProjects];
    renderFilters(allProjectsCache);
    renderSlider(allProjectsCache);
    renderProjects(allProjectsCache, currentFilter || 'all');
}

function loadProjects() {
    // Always render built-in portfolio projects immediately
    renderLocalProjectsFallback();

    if (!db) return;

    try {
        const projectsQuery = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
        onSnapshot(projectsQuery, (snapshot) => {
            const firebaseProjects = [];
            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                const normalized = { id: docSnap.id, ...data, category: normalizeCategory(data.category) };
                if (!myProjects.some(mp => (mp.link && mp.link !== '#projects' && mp.link === normalized.link) || mp.title === normalized.title)) {
                    firebaseProjects.push(normalized);
                }
            });
            allProjectsCache = [...myProjects, ...firebaseProjects];
            renderFilters(allProjectsCache);
            renderSlider(allProjectsCache);
            renderProjects(allProjectsCache, currentFilter);
        }, (err) => {
            renderLocalProjectsFallback();
            handleFirestoreError(err, OperationType.LIST, 'projects');
        });
    } catch (e) {
        renderLocalProjectsFallback();
        handleFirestoreError(e, OperationType.LIST, 'projects');
    }
}

function getProjTitle(p) { return currentLang === 'ar' ? (p.title_ar || p.title) : p.title; }
function getProjDesc(p) { return currentLang === 'ar' ? (p.desc_ar || p.desc) : p.desc; }

function getProjCategoryLabel(cat) {
    const keyMap = {
        graphic: 'cat_graphic',
        motion: 'cat_motion',
        branding: 'cat_branding',
        wordpress: 'cat_wordpress',
        english: 'cat_english',
        arabic: 'cat_arabic',
        science: 'cat_science',
        math: 'cat_math',
        social: 'cat_social',
        islamic: 'cat_islamic',
        health: 'cat_health'
    };
    const key = keyMap[cat] || 'cat_creative';
    return translations[currentLang][key] || cat;
}

function isVideoProject(p) {
    if (p.category === 'motion') return true;
    return (p.link && (p.link.includes('canva.link') || p.link.includes('.mp4'))) ||
           (p.title && p.title.toLowerCase().includes('video'));
}

function getProjectTypeIcon(p) {
    if (p.category === 'graphic') return '🎨';
    if (p.category === 'branding') return '📘';
    if (isVideoProject(p)) return '🎬';
    return '🌐';
}

function buildProjectThumbHTML(proj, isSlider = false) {
    const title = getProjTitle(proj);
    const sc = proj.showcase;
    if (sc && sc.mode === 'posters') {
        return `
            <div class="thumb-showcase">
                <img src="${encodeURI(sc.backdrop)}" alt="" class="thumb-backdrop" loading="lazy">
                <div class="thumb-vignette"></div>
                <div class="thumb-fan">
                    <div class="thumb-poster-frame thumb-poster-left">
                        <img src="${encodeURI(sc.left)}" alt="${title}" loading="lazy">
                    </div>
                    <div class="thumb-poster-frame thumb-poster-center">
                        <img src="${encodeURI(sc.center)}" alt="${title}" loading="lazy">
                    </div>
                    <div class="thumb-poster-frame thumb-poster-right">
                        <img src="${encodeURI(sc.right)}" alt="${title}" loading="lazy">
                    </div>
                </div>
            </div>`;
    }
    if (sc && sc.mode === 'motion') {
        return `
            <div class="thumb-showcase">
                <img src="${encodeURI(sc.backdrop)}" alt="" class="thumb-backdrop" loading="lazy">
                <div class="thumb-vignette"></div>
                <div class="thumb-motion-stage">
                    <div class="thumb-cinema-screen">
                        <img src="${encodeURI(sc.main)}" alt="${title}" loading="lazy">
                        <span class="thumb-play-dot" aria-hidden="true">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>
                        </span>
                    </div>
                    <div class="thumb-reel-card secondary">
                        <img src="${encodeURI(sc.reelBack)}" alt="${title}" loading="lazy">
                    </div>
                    <div class="thumb-reel-card">
                        <img src="${encodeURI(sc.reelFront)}" alt="${title}" loading="lazy">
                    </div>
                </div>
            </div>`;
    }
    if (sc && sc.mode === 'branding') {
        const iconTags = (sc.icons || []).map(ic => `<img src="${encodeURI(ic)}" alt="" loading="lazy">`).join('');
        return `
            <div class="thumb-showcase">
                <img src="${encodeURI(sc.backdrop)}" alt="" class="thumb-backdrop" loading="lazy">
                <div class="thumb-vignette"></div>
                <div class="thumb-brand-stage">
                    <div class="thumb-map-board">
                        <img src="${encodeURI(sc.map)}" alt="${title}" loading="lazy">
                    </div>
                    <div class="thumb-identity-sheet">
                        <img src="${encodeURI(sc.identity)}" alt="${title}" loading="lazy">
                    </div>
                    ${iconTags ? `<div class="thumb-icons-strip">${iconTags}</div>` : ''}
                </div>
            </div>`;
    }
    const imgClass = isSlider ? 'slider-bg-img' : 'project-img';
    return `<img src="${encodeURI(proj.image)}" alt="${title}" class="${imgClass}" loading="lazy" onerror="this.src='assets/img/covers/mastery-funnel.svg'">`;
}

function renderProjects(projects, filter = 'all') {
    const container = document.getElementById('projectsContainer');
    if (!container) return;

    const filtered = filter === 'all' ? projects : projects.filter(p => p.category === filter);

    if (filtered.length === 0) {
        container.innerHTML = `<p class="text-center w-full" style="grid-column: 1/-1; padding: 2rem;">${translations[currentLang].no_projects}</p>`;
        const showMoreBtn = document.getElementById('showMoreBtn');
        if (showMoreBtn) showMoreBtn.classList.remove('visible');
        return;
    }

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const initialCount = isMobile ? MOBILE_INITIAL_COUNT : DESKTOP_INITIAL_COUNT;
    visibleCount = initialCount;

    container.innerHTML = '';
    filtered.forEach((proj, idx) => {
        const typeIcon = getProjectTypeIcon(proj);
        const inSite = hasInSiteViewer(proj);
        const ctaText = inSite ? translations[currentLang].preview_insite : translations[currentLang].preview_project;
        const div = document.createElement('div');
        div.className = `project-card glass ${proj.category}`;
        if (idx >= visibleCount) div.classList.add('hidden-card');

        const linkAttrs = inSite ? 'href="#projects"' : `href="${proj.link}" target="_blank" rel="noopener"`;
        div.innerHTML = `
            <a ${linkAttrs} class="project-card-link">
                <div class="project-img-container">
                    ${buildProjectThumbHTML(proj, false)}
                    <div class="project-overlay">
                        <span class="btn btn-primary">${ctaText}</span>
                    </div>
                    <div class="project-type-badge">${typeIcon}</div>
                </div>
                <div class="project-info">
                    <span class="project-category">${getProjCategoryLabel(proj.category)}</span>
                    <h3>${getProjTitle(proj)}</h3>
                    <p>${getProjDesc(proj)}</p>
                </div>
            </a>`;

        if (inSite) {
            const linkEl = div.querySelector('.project-card-link');
            linkEl.addEventListener('click', (e) => {
                e.preventDefault();
                openProjectViewer(proj);
            });
        }
        container.appendChild(div);
    });

    const showMoreBtn = document.getElementById('showMoreBtn');
    if (showMoreBtn) {
        if (isMobile && filtered.length > MOBILE_INITIAL_COUNT) {
            showMoreBtn.classList.add('visible');
            showMoreBtn.classList.remove('expanded');
            showMoreBtn.textContent = translations[currentLang].show_more;
        } else {
            showMoreBtn.classList.remove('visible');
            showMoreBtn.classList.remove('expanded');
        }
    }
}

function renderFilters(projects) {
    const filterContainer = document.getElementById('projectFilters');
    if (!filterContainer) return;

    const presentCats = new Set(projects.map(p => p.category));
    const catOrder = ['graphic', 'motion', 'branding', 'wordpress', 'english', 'arabic', 'science', 'math', 'social', 'islamic', 'health', 'other'];
    const labelKeyMap = {
        all: 'filter_all',
        graphic: 'filter_graphic',
        motion: 'filter_motion',
        branding: 'filter_branding',
        wordpress: 'filter_wordpress',
        english: 'filter_english',
        arabic: 'filter_arabic',
        science: 'filter_science',
        math: 'filter_math',
        social: 'filter_social',
        islamic: 'filter_islamic',
        health: 'filter_health',
        other: 'filter_other'
    };
    const filters = ['all', ...catOrder.filter(c => presentCats.has(c))];

    filterContainer.innerHTML = '';
    filters.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn' + (cat === currentFilter ? ' active' : '');
        btn.setAttribute('data-filter', cat);
        btn.setAttribute('data-i18n', labelKeyMap[cat]);
        btn.textContent = translations[currentLang][labelKeyMap[cat]] || cat;
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(f => f.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = cat;
            renderProjects(allProjectsCache, cat);
            playSound('click');
        });
        filterContainer.appendChild(btn);
    });
}

function setupShowMore() {
    const showMoreBtn = document.getElementById('showMoreBtn');
    if (!showMoreBtn) return;
    showMoreBtn.addEventListener('click', () => {
        const cards = document.querySelectorAll('#projectsContainer .project-card');
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        if (!isMobile) return;

        const isExpanded = showMoreBtn.classList.contains('expanded');
        if (isExpanded) {
            cards.forEach((c, i) => {
                if (i >= MOBILE_INITIAL_COUNT) c.classList.add('hidden-card');
            });
            showMoreBtn.classList.remove('expanded');
            showMoreBtn.textContent = translations[currentLang].show_more;
        } else {
            cards.forEach(c => c.classList.remove('hidden-card'));
            showMoreBtn.classList.add('expanded');
            showMoreBtn.textContent = translations[currentLang].show_less;
        }
        playSound('click');
    });

    let wasMobile = window.matchMedia('(max-width: 768px)').matches;
    let resizeTimer = null;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const isMobile = window.matchMedia('(max-width: 768px)').matches;
            if (isMobile !== wasMobile) {
                wasMobile = isMobile;
                if (allProjectsCache.length) {
                    renderProjects(allProjectsCache, currentFilter);
                }
            }
        }, 250);
    });
}

/* ==========================================================================
   Projects Slider / Carousel
   ========================================================================== */
let sliderIndex = 0;
let sliderAutoplay = null;
let sliderCardsPerView = 3;

function getSliderCardsPerView() {
    const w = window.innerWidth;
    if (w <= 768) return 1;
    if (w <= 992) return 2;
    return 3;
}

function renderSlider(projects) {
    const track = document.getElementById('sliderTrack');
    if (!track) return;

    const featured = projects.slice(0, Math.min(8, projects.length));

    track.innerHTML = '';
    featured.forEach((proj) => {
        const inSite = hasInSiteViewer(proj);
        const linkAttrs = inSite ? 'href="#projects"' : `href="${proj.link}" target="_blank" rel="noopener"`;
        const card = document.createElement('div');
        card.className = 'slider-card';
        card.innerHTML = `
            <a ${linkAttrs} class="slider-card-link" style="display:block; width:100%; height:100%; position:relative;">
                ${buildProjectThumbHTML(proj, true)}
                <div class="slider-card-tag">${getProjCategoryLabel(proj.category)}</div>
                <div class="slider-card-overlay">
                    <h3>${getProjTitle(proj)}</h3>
                    <p>${getProjDesc(proj)}</p>
                </div>
            </a>`;
        if (inSite) {
            const linkEl = card.querySelector('.slider-card-link');
            linkEl.addEventListener('click', (e) => {
                e.preventDefault();
                openProjectViewer(proj);
            });
        }
        track.appendChild(card);
    });

    sliderCardsPerView = getSliderCardsPerView();
    sliderIndex = 0;
    buildDots(featured);
    updateSliderPosition();
    startAutoplay();
}

function buildDots(projects) {
    const dotsContainer = document.getElementById('sliderDots');
    if (!dotsContainer) return;
    const totalSlides = Math.max(1, projects.length - sliderCardsPerView + 1);
    dotsContainer.innerHTML = '';
    for (let i = 0; i < totalSlides; i++) {
        const dot = document.createElement('button');
        dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
        dot.addEventListener('click', () => {
            sliderIndex = i;
            updateSliderPosition();
            restartAutoplay();
            playSound('click');
        });
        dotsContainer.appendChild(dot);
    }
}

function updateSliderPosition() {
    const track = document.getElementById('sliderTrack');
    if (!track) return;
    const cards = track.children;
    if (!cards.length) return;
    const cardWidth = cards[0].getBoundingClientRect().width;
    const gap = 24; // matches CSS gap of 1.5rem
    const offset = sliderIndex * (cardWidth + gap);
    track.style.transform = `translateX(-${offset}px)`;

    // Update dots
    const dots = document.querySelectorAll('.slider-dot');
    dots.forEach((d, i) => d.classList.toggle('active', i === sliderIndex));
}

function nextSlider() {
    const track = document.getElementById('sliderTrack');
    if (!track) return;
    const totalCards = track.children.length;
    const maxIndex = Math.max(0, totalCards - sliderCardsPerView);
    sliderIndex = (sliderIndex + 1) > maxIndex ? 0 : sliderIndex + 1;
    updateSliderPosition();
}
function prevSlider() {
    const track = document.getElementById('sliderTrack');
    if (!track) return;
    const totalCards = track.children.length;
    const maxIndex = Math.max(0, totalCards - sliderCardsPerView);
    sliderIndex = (sliderIndex - 1) < 0 ? maxIndex : sliderIndex - 1;
    updateSliderPosition();
}
function startAutoplay() {
    stopAutoplay();
    sliderAutoplay = setInterval(nextSlider, 5000);
}
function stopAutoplay() {
    if (sliderAutoplay) { clearInterval(sliderAutoplay); sliderAutoplay = null; }
}
function restartAutoplay() {
    stopAutoplay();
    startAutoplay();
}

function setupSliderControls() {
    const prev = document.getElementById('sliderPrev');
    const next = document.getElementById('sliderNext');
    const wrapper = document.getElementById('projectsSlider');
    if (prev) prev.addEventListener('click', () => { prevSlider(); restartAutoplay(); playSound('click'); });
    if (next) next.addEventListener('click', () => { nextSlider(); restartAutoplay(); playSound('click'); });
    if (wrapper) {
        wrapper.addEventListener('mouseenter', stopAutoplay);
        wrapper.addEventListener('mouseleave', startAutoplay);

        // Touch swipe support
        let touchStartX = 0;
        wrapper.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
        wrapper.addEventListener('touchend', (e) => {
            const dx = e.changedTouches[0].clientX - touchStartX;
            if (Math.abs(dx) > 50) {
                if (dx < 0) nextSlider(); else prevSlider();
                restartAutoplay();
            }
        }, { passive: true });
    }
    // Recompute on resize
    window.addEventListener('resize', () => {
        sliderCardsPerView = getSliderCardsPerView();
        sliderIndex = 0;
        updateSliderPosition();
        if (allProjectsCache.length) buildDots(allProjectsCache.slice(0, Math.min(8, allProjectsCache.length)));
    });
}

/* ==========================================================================
   Reviews / Testimonials
   ========================================================================== */
function loadReviews() {
    const container = document.getElementById('testimonialsContainer');
    if (!container) return;
    if (!db) { container.innerHTML = `<p>${translations[currentLang].no_reviews}</p>`; return; }
    try {
        const reviewsQuery = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
        onSnapshot(reviewsQuery, (snapshot) => {
            const reviews = [];
            snapshot.forEach(docSnap => reviews.push(docSnap.data()));
            container.innerHTML = '';
            if (reviews.length === 0) {
                const empty = document.createElement('p');
                empty.textContent = translations[currentLang].no_reviews;
                container.appendChild(empty);
                return;
            }
            reviews.forEach(review => {
                const div = document.createElement('div');
                div.className = 'testimonial-card glass';
                const safeRating = Math.min(5, Math.max(1, Number(review.rating) || 5));

                const starsEl = document.createElement('div');
                starsEl.className = 'stars';
                starsEl.textContent = '★'.repeat(safeRating) + '☆'.repeat(5 - safeRating);

                const quoteEl = document.createElement('p');
                quoteEl.style.fontStyle = 'italic';
                quoteEl.style.flexGrow = '1';
                quoteEl.textContent = `"${String(review.text || '')}"`;

                const authorEl = document.createElement('p');
                authorEl.style.fontWeight = 'bold';
                authorEl.style.color = 'var(--clr-text-main)';
                authorEl.textContent = `- ${String(review.name || '')}`;

                div.appendChild(starsEl);
                div.appendChild(quoteEl);
                div.appendChild(authorEl);
                container.appendChild(div);
            });
        }, (err) => {
            container.innerHTML = `<p>${translations[currentLang].no_reviews}</p>`;
            handleFirestoreError(err, OperationType.LIST, 'reviews');
        });
    } catch (e) {
        container.innerHTML = `<p>${translations[currentLang].no_reviews}</p>`;
        handleFirestoreError(e, OperationType.LIST, 'reviews');
    }
}

/* ==========================================================================
   Forms
   ========================================================================== */
function setupForms() {
    // Review form
    const reviewForm = document.getElementById('reviewForm');
    const starRating = document.getElementById('starRating');
    const ratingValue = document.getElementById('ratingValue');
    if (starRating && ratingValue) {
        const stars = starRating.querySelectorAll('span');
        let currentRating = 0;
        stars.forEach(star => {
            star.addEventListener('mouseenter', () => {
                const val = parseInt(star.getAttribute('data-value'));
                stars.forEach((s, i) => s.classList.toggle('active', i < val));
            });
            star.addEventListener('mouseleave', () => {
                stars.forEach((s, i) => s.classList.toggle('active', i < currentRating));
            });
            star.addEventListener('click', () => {
                currentRating = parseInt(star.getAttribute('data-value'));
                ratingValue.value = currentRating;
                stars.forEach((s, i) => s.classList.toggle('active', i < currentRating));
                playSound('click');
            });
        });
    }
    if (reviewForm) {
        reviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('reviewerName').value.trim().slice(0, 100);
            const text = document.getElementById('reviewText').value.trim().slice(0, 1000);
            const rating = parseInt(ratingValue.value, 10);
            if (!name || !text || !Number.isInteger(rating) || rating < 1 || rating > 5) return;
            if (db) {
                try {
                    await addDoc(collection(db, 'reviews'), {
                        name,
                        text,
                        rating,
                        createdAt: serverTimestamp()
                    });
                } catch (err) {
                    showNotice(translations[currentLang].no_reviews, true);
                    handleFirestoreError(err, OperationType.CREATE, 'reviews');
                }
            }
            reviewForm.reset();
            document.querySelectorAll('#starRating span').forEach(s => s.classList.remove('active'));
            ratingValue.value = '';
            showNotice(translations[currentLang].review_thanks);
            playSound('send');
        });
    }

    // Contact form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('contactName').value.trim().slice(0, 100);
            const email = document.getElementById('contactEmail').value.trim().slice(0, 150);
            const message = document.getElementById('contactMessage').value.trim().slice(0, 3000);
            if (!name || !email || !message) return;
            if (db) {
                try {
                    await addDoc(collection(db, 'messages'), {
                        name,
                        email,
                        message,
                        createdAt: serverTimestamp()
                    });
                } catch (err) {
                    showNotice('Could not send message. Please check your input.', true);
                    handleFirestoreError(err, OperationType.CREATE, 'messages');
                }
            }
            contactForm.reset();
            showNotice(translations[currentLang].contact_success);
            playSound('send');
        });
    }
}

/* ==========================================================================
   Chatbot
   ========================================================================== */
function setupChatbot() {
    const chatToggleBtn = document.getElementById('chatToggleBtn');
    const chatCloseBtn = document.getElementById('chatCloseBtn');
    const chatInterface = document.getElementById('chatInterface');
    const chatInput = document.getElementById('chatInput');
    const chatSendBtn = document.getElementById('chatSendBtn');
    const chatBody = document.getElementById('chatBody');
    const quickReplies = document.querySelectorAll('.chat-chip');

    if (!chatInterface || !chatToggleBtn) return;

    const toggleChat = () => {
        const isVisible = chatInterface.style.display === 'flex';
        chatInterface.style.display = isVisible ? 'none' : 'flex';
        if (!isVisible && chatBody.children.length === 0) {
            sendBotMessage(translations[currentLang].chat_welcome);
        }
        playSound(isVisible ? 'click' : 'open');
    };

    chatToggleBtn.addEventListener('click', toggleChat);
    chatCloseBtn?.addEventListener('click', () => { chatInterface.style.display = 'none'; playSound('click'); });

    // 🔑 Auto-open chat on first visit (per browser session)
    if (!sessionStorage.getItem('chat_auto_opened')) {
        setTimeout(() => {
            if (chatInterface.style.display !== 'flex') {
                toggleChat(); // opens chat AND sends welcome message
            }
            sessionStorage.setItem('chat_auto_opened', '1');
        }, 2500);
    }

    const handleSend = () => {
        const text = chatInput.value.trim();
        if (!text) return;
        appendMessage('user', text);
        chatInput.value = '';
        processAIResponse(text);
        playSound('send');
    };

    chatSendBtn?.addEventListener('click', handleSend);
    chatInput?.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSend(); });

    quickReplies.forEach(chip => {
        chip.addEventListener('click', () => {
            const msg = chip.textContent;
            appendMessage('user', msg);
            processAIResponse(chip.getAttribute('data-msg'));
            playSound('send');
        });
    });
}

function appendMessage(role, text) {
    const chatBody = document.getElementById('chatBody');
    if (!chatBody) return;
    const div = document.createElement('div');
    div.className = `chat-message ${role}`;
    div.innerHTML = text;
    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;
}

function sendBotMessage(text) {
    setTimeout(() => appendMessage('bot', text), 600);
}

function processAIResponse(input) {
    const lowerInput = (input || '').toLowerCase();
    let response = "";

    if (currentLang === 'ar') {
        if (lowerInput.includes('experience') || lowerInput.includes('cv') || lowerInput.includes('خبر') || lowerInput.includes('سيرة')) {
            response = "فاطمة ربيع أخصائية العمليات الرقمية والتكنولوجيا (بكالوريوس تكنولوجيا التعليم - جامعة المنصورة). عملت كمديرة تنفيذية للعمليات في عُمان، وأخصائية محتوى ذكاء اصطناعي في AI AstorLab بالسعودية، ومصممة مواقع وعروض تعليمية، وتدير حالياً مواقع ووردبريس ومتاجر ووكومرس لعملاء في السعودية.";
        } else if (lowerInput.includes('services') || lowerInput.includes('خدمات')) {
            response = "تقدم فاطمة خدمات متكاملة تشمل: إدارة العمليات الرقمية وتنسيق الفرق، إدارة ووردبريس وووكومرس، إعداد ومراجعة المحتوى العربي للذكاء الاصطناعي والأوامر (Prompts)، المواقع التعليمية والعروض ثلاثية الأبعاد، الموشن جرافيك والجرافيك، والدعم الفني والإداري.";
        } else if (lowerInput.includes('contact') || lowerInput.includes('تواصل') || lowerInput.includes('توظيف') || lowerInput.includes('email') || lowerInput.includes('ايميل')) {
            response = "يمكنك التواصل مع فاطمة عبر البريد الإلكتروني: fatmarabea4444@gmail.com أو عبر حساب LinkedIn أو عبر نموذج التواصل أسفله!";
        } else {
            response = "أنا هنا للمساعدة! يمكنك سؤالي عن خبرات فاطمة في العمليات الرقمية، الذكاء الاصطناعي، ووردبريس، المواقع التعليمية، أو طرق التواصل معها.";
        }
    } else {
        if (lowerInput.includes('experience') || lowerInput.includes('cv') || lowerInput.includes('resume')) {
            response = "Fatma Rabie is a Digital Operations & Technology Specialist (B.Ed. Educational Technology, Mansoura University). Her experience includes CEO – Business Operations in Oman, AI Content & Projects Specialist at AI AstorLab (KSA), Educational Website & 3D Presentation Design, ASP.NET training, and WordPress & WooCommerce operations.";
        } else if (lowerInput.includes('services') || lowerInput.includes('what do you do')) {
            response = "Fatma delivers Digital & Business Operations coordination, WordPress & WooCommerce management, Arabic AI Content & Prompt preparation, Educational Websites & 3D Presentations, Motion Graphics & Graphic Design, and Technical/Admin Support.";
        } else if (lowerInput.includes('contact') || lowerInput.includes('hire') || lowerInput.includes('email')) {
            response = "You can reach Fatma directly at fatmarabea4444@gmail.com, connect via her LinkedIn profile, or send a message using the contact form below!";
        } else {
            response = "I'd be happy to help! Ask me about Fatma's experience across KSA, Oman & Egypt, her digital operations & AI content services, or how to contact her.";
        }
    }
    sendBotMessage(response);
}

/* ==========================================================================
   Intersection Observers + active nav link
   ========================================================================== */
function setupIntersectionObservers() {
    const fadeElements = document.querySelectorAll('.fade-up, .fade-in, .scale-in');
    const revealVisibleNow = () => {
        fadeElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight + 120) {
                el.classList.add('visible');
            }
        });
    };
    revealVisibleNow();

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.01, rootMargin: '120px 0px' });
    fadeElements.forEach(el => observer.observe(el));

    // Active nav link based on visible section
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links a');
    const navObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                navLinks.forEach(a => {
                    a.classList.toggle('active', a.getAttribute('href') === '#' + id);
                });
            }
        });
    }, { threshold: 0.4 });
    sections.forEach(s => navObserver.observe(s));
}

/* ==========================================================================
   Active section highlight on click
   ========================================================================== */
function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

/* ==========================================================================
   Site Settings (controlled from admin panel)
   ========================================================================== */
function applySiteSettings(settings) {
    if (!settings) return;
    const slider = document.getElementById('projects-slider');
    const soundToggle = document.getElementById('soundToggle');
    const chatbotWidget = document.getElementById('chatbot-widget');
    const scrollTopBtn = document.getElementById('scrollTopBtn');

    if (slider) slider.style.display = settings.show_slider === false ? 'none' : '';
    if (soundToggle) soundToggle.style.display = settings.show_sound === false ? 'none' : '';
    if (chatbotWidget) chatbotWidget.style.display = settings.show_chatbot === false ? 'none' : '';
    if (scrollTopBtn) scrollTopBtn.style.display = settings.show_scroll_top === false ? 'none' : '';
}

function loadSiteSettings() {
    const defaults = { show_slider: true, show_sound: true, show_chatbot: true, show_scroll_top: true };

    // Try localStorage first (set by admin)
    try {
        const local = localStorage.getItem('site_settings');
        if (local) {
            applySiteSettings({ ...defaults, ...JSON.parse(local) });
        } else {
            applySiteSettings(defaults);
        }
    } catch (e) { applySiteSettings(defaults); }

    // Then try Firebase (overrides localStorage if present)
    if (db) {
        try {
            onSnapshot(doc(db, 'settings', 'site'), (docSnap) => {
                if (docSnap.exists()) {
                    const s = docSnap.data();
                    const merged = { ...defaults, ...s };
                    applySiteSettings(merged);
                    try { localStorage.setItem('site_settings', JSON.stringify(merged)); } catch (e) {}
                }
            }, (err) => {
                handleFirestoreError(err, OperationType.GET, 'settings/site');
            });
        } catch (e) {
            handleFirestoreError(e, OperationType.GET, 'settings/site');
        }
    }
}

/* ==========================================================================
   Init
   ========================================================================== */
function hidePreloader() {
    if (preloader) {
        preloader.classList.add('hidden');
        setTimeout(() => { if (preloader) preloader.style.display = 'none'; }, 700);
    }
}

async function init() {
    // Apply theme + language first
    setTheme(currentTheme);
    setLanguage(currentLang);

    // Year
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // Render static/local UI & observers immediately so page never stalls
    renderLocalProjectsFallback();
    setupProjectViewerModal();
    setupIntersectionObservers();
    setupChatbot();
    setupForms();
    setupShowMore();
    setupSliderControls();
    setupSmoothScroll();

    // Animate counters once hero is visible
    setTimeout(() => {
        document.querySelectorAll('.stat-num').forEach(el => {
            const target = parseInt(el.getAttribute('data-count'));
            if (!isNaN(target)) animateCounter(el, target);
        });
    }, 600);

    // Hide preloader once initial UI is ready
    setTimeout(hidePreloader, 400);

    // Initial scroll state
    onScroll();

    // Initialize Firebase from firebase-applet-config.json & attach Firestore listeners
    const fb = await initFirebase();
    db = fb.db;
    loadProjects();
    loadReviews();
    loadSiteSettings();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
