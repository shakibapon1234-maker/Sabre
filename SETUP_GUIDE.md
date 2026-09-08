# Sabre Training Simulator — সেটআপ গাইড

স্বাধীন এডুকেশনাল টুল। Sabre Corporation-এর সাথে কোনো অ্যাফিলিয়েশন নেই। কোনো লাইভ GDS নেটওয়ার্কের সাথে সংযুক্ত না — সব ডেটা লোকালি জেনারেট হয়।

এই গাইডে তিনটা ডেলিভারি মোড সেটআপ করার ধাপ দেওয়া আছে: **ব্রাউজার**, **Electron ডেস্কটপ অ্যাপ**, এবং **Android APK**। তিনটাই একই `sabre-engine` (js/ ফোল্ডার) শেয়ার করে — শুধু wrapper আলাদা।

---

## প্রজেক্ট স্ট্রাকচার

```
sabre/
├── index.html                     # মূল টার্মিনাল UI (ব্রাউজার + ডেস্কটপ + Android শেয়ার্ড)
├── js/
│   ├── sb-airports.js             # এয়ারপোর্ট/এয়ারলাইন/হাব ডেটা (৫৫+ এয়ারপোর্ট, ২০টা এয়ারলাইন)
│   ├── sb-availability.js         # সিডেড PRNG ফ্লাইট শিডিউল জেনারেটর
│   ├── sb-pnr.js                  # state ম্যানেজমেন্ট, রেন্ডারিং, লেসন PNR লোডার
│   ├── sb-commands.js             # কমান্ড পার্সার ও হ্যান্ডলার + এরর কেস
│   └── sb-app.js                  # UI init, টার্মিনাল হুকআপ, Command Helper পপআপ
├── main.js                        # Electron main process (BrowserWindow, মেনু টেমপ্লেট)
├── package.json                   # Electron/electron-builder কনফিগ
├── Start_Desktop.bat              # ডেস্কটপ লঞ্চার (npm install অটো-চেক + সাইলেন্ট লঞ্চ)
├── Admin_License_Generator.html   # অফলাইন লাইসেন্স কী জেনারেটর (SBR-AAAA-BBBB-CCCC)
├── Generate_License.bat           # লঞ্চার
├── SABRE_COMMANDS_CHEATSHEET.md   # সম্পূর্ণ কমান্ড রেফারেন্স
├── STUDENT_TRAINING_LECTURE_SHEET.md  # ক্লাস-রেডি লেকচার শিট
├── README.md                      # প্রজেক্ট ওভারভিউ, ফিচার লিস্ট
├── SETUP_GUIDE.md                 # এই ফাইল
├── android/                       # Android Gradle প্রজেক্ট
│   ├── build.gradle               # প্রজেক্ট-লেভেল Gradle কনফিগ
│   ├── settings.gradle
│   ├── app/
│   │   ├── build.gradle           # compileSdk 34 / minSdk 24, applicationId com.sabre.training
│   │   ├── src/main/java/com/sabre/training/
│   │   │   ├── MainActivity.java      # WebView + FLAG_SECURE + লাইসেন্স রিচেক
│   │   │   ├── LicenseActivity.java   # এন্ট্রি স্ক্রিন
│   │   │   └── LicenseManager.java    # কী ভ্যালিডেশন, ডিভাইস-বাইন্ডিং, tamper-detection
│   │   ├── src/main/assets/www/       # index.html + js/ (সিঙ্কড কপি — Build_APK.bat অটো-সিঙ্ক করে)
│   │   ├── src/main/res/              # layouts, strings, styles
│   │   └── src/main/AndroidManifest.xml
├── Build_APK.bat                  # assets sync + gradlew assembleRelease
└── Start_APK.bat                  # adb install + launch
```

---

## অপশন ১ — ব্রাউজারে (সবচেয়ে দ্রুত, কোনো ইনস্টল লাগে না)

**প্রয়োজন:** যেকোনো মডার্ন ব্রাউজার (Chrome, Edge, Firefox)।

**ধাপ:**
1. `sabre/index.html` ফাইলটা খুঁজে বের করুন।
2. ফাইলটার ওপর ডাবল-ক্লিক করুন, অথবা ব্রাউজার খুলে `Ctrl+O` দিয়ে ফাইলটা সিলেক্ট করুন।
3. টার্মিনাল UI লোড হয়ে যাবে — সরাসরি কমান্ড টাইপ করা শুরু করতে পারবেন।

এই মোডে লাইসেন্সিং লাগে না (লাইসেন্স সিস্টেম শুধু Android বিল্ডে সক্রিয়)। ডেটা কোথাও সেভ হয় না — পেজ রিফ্রেশ করলে সেশন রিসেট হয়ে যাবে।

---

## অপশন ২ — Electron ডেস্কটপ অ্যাপ (Windows)

**প্রয়োজন:** [Node.js](https://nodejs.org) (npm সহ) ইনস্টল করা থাকতে হবে।

**ধাপ:**
```
cd sabre
npm install
npm start
```

অথবা `Start_Desktop.bat` ফাইলে ডাবল-ক্লিক করুন — এটা `node_modules` ফোল্ডার আছে কিনা চেক করবে, না থাকলে অটোমেটিক `npm install` চালাবে, তারপর অ্যাপ লঞ্চ করবে।

**মেনু বার থেকে যা পাওয়া যাবে:**
- Reset Session
- Load Lesson PNR (K7QZLM)
- GDS Commands সাবমেনু: `*R`, `ER`, `WPNCB`, `WT` — এক ক্লিকে ইনপুটে বসে যায়
- About ডায়ালগ

**ইনস্টলার / পোর্টেবল বিল্ড বানাতে:**
```
npm run build-win        # NSIS ইনস্টলার (ia32 + x64), dist/ ফোল্ডারে তৈরি হবে
npm run build-portable   # পোর্টেবল .exe, ইনস্টল ছাড়াই চলে
```

**নোট:** `main.js` একটা `icon.ico`/`icon.png` রেফারেন্স করার চেষ্টা করে — ফাইলটা এখনো যোগ করা হয়নি, তবে না পেলে গ্রেসফুলি স্কিপ করে (অ্যাপ ডিফল্ট Electron আইকন নিয়ে চলবে)।

---

## অপশন ৩ — Android APK

**প্রয়োজন:**
- [Android Studio](https://developer.android.com/studio) অথবা শুধু Android SDK + Gradle (command-line tools)
- JDK 17+
- একটা Android ডিভাইস বা এমুলেটর (টেস্টের জন্য), `adb` পাথে থাকা উচিত `Start_APK.bat` কাজ করার জন্য

**বিল্ড করতে:**
```
cd sabre
Build_APK.bat
```
এই স্ক্রিপ্ট প্রথমে `index.html` ও `js/` ফোল্ডার `android/app/src/main/assets/www/`-এ সিঙ্ক করে (যাতে ওয়েব অ্যাসেট সবসময় লেটেস্ট থাকে), তারপর `gradlew assembleRelease` চালিয়ে APK বিল্ড করে।

ম্যানুয়ালি চাইলে:
```
cd sabre/android
gradlew assembleRelease
```
(ম্যানুয়াল রুটে অ্যাসেট সিঙ্ক নিজে করতে হবে — `Build_APK.bat` ব্যবহার করাই নিরাপদ।)

**ডিভাইসে ইনস্টল ও রান করতে:**
```
Start_APK.bat
```
এটা `adb install` দিয়ে বিল্ড হওয়া APK ইনস্টল করে এবং `MainActivity` লঞ্চ করে।

**⚠️ বিল্ডের আগে দরকার:** `AndroidManifest.xml` `@mipmap/ic_launcher` রেফারেন্স করে কিন্তু প্রজেক্টে এখনো লঞ্চার আইকন (`mipmap-*` ফোল্ডার) যোগ করা হয়নি। প্রথম রিলিজ বিল্ডের আগে অন্তত একটা ডিফল্ট আইকন সেট (mipmap-mdpi/hdpi/xhdpi ইত্যাদি) যোগ করুন, নাহলে বিল্ড ফেল করতে পারে।

### লাইসেন্স অ্যাক্টিভেশন (শুধু Android)

Android বিল্ডে অ্যাপ খুললে প্রথমে `LicenseActivity` দেখাবে — একটা `SBR-AAAA-BBBB-CCCC` ফরম্যাটের কী চাইবে।

**কী জেনারেট করতে:**
1. `Admin_License_Generator.html` ব্রাউজারে ওপেন করুন, অথবা `Generate_License.bat` চালান।
2. ১–৫০টা কী এক ব্যাচে জেনারেট করা যায়।
3. জেনারেট হওয়া কী কপি করে ডিভাইসে `LicenseActivity` স্ক্রিনে পেস্ট করুন।

**লাইসেন্স স্টেট যা হ্যান্ডল হয়:** `NOT_ACTIVATED`, `ACTIVE`, `EXPIRED` (৭৩০ দিন validity), `WRONG_DEVICE` (কী অন্য ডিভাইসে বাইন্ড করা), `TAMPERED` (SharedPreferences ম্যানুয়ালি এডিট করা হলে), `INVALID_KEY` (ভুল ফরম্যাট বা checksum না মেলা)। প্রতিটা `onResume()`-এ রিচেক হয়, তাই মাঝ-সেশনে expire/tamper করলে অ্যাপ বের করে দেবে।

**গুরুত্বপূর্ণ:** `LicenseManager.java`-র `MASTER_SECRET` আর `Admin_License_Generator.html`-এর `MASTER_SECRET` অবশ্যই একই থাকতে হবে — একটা বদলালে অন্যটাও বদলাতে হবে (দুই ফাইলেই কোড কমেন্টে এই রিমাইন্ডার আছে)।

---

## GitHub Pages / Vercel-এ স্ট্যাটিক ডিপ্লয় (ব্রাউজার ভার্সন)

শুধু `index.html` ও `js/` ফোল্ডার লাগবে — `main.js`, `package.json`, `android/` স্ট্যাটিক হোস্টিং-এ দরকার নেই।

- **GitHub Pages:** রিপো পুশ করে Settings → Pages → Source-এ ব্রাঞ্চ ও ফোল্ডার সিলেক্ট করুন।
- **Vercel:** রিপো ইম্পোর্ট করে Framework preset "Other"/Static, Root Directory `sabre` দিন, Build command খালি, Output directory `.`।

কোনো ব্যাকএন্ড লাগে না — Netlify, Cloudflare Pages ইত্যাদি যেকোনো স্ট্যাটিক হোস্টে কাজ করবে।

---

## সমস্যা সমাধান (Troubleshooting)

| সমস্যা | সম্ভাব্য কারণ | সমাধান |
|---|---|---|
| ব্রাউজারে খুললে সাদা পেজ / কমান্ড কাজ করে না | `js/` ফোল্ডার `index.html`-এর পাশে নেই | পুরো `sabre/` ফোল্ডার একসাথে রাখুন, শুধু `index.html` কপি করবেন না |
| `npm start`-এ এরর | Node.js ইনস্টল নেই বা `npm install` করা হয়নি | Node.js ইনস্টল করুন, তারপর `sabre/` ফোল্ডারে `npm install` চালান |
| Electron অ্যাপে আইকন নেই | `icon.ico`/`icon.png` এখনো প্রজেক্টে যোগ করা হয়নি | কার্যক্ষমতায় প্রভাব নেই, চাইলে নিজের আইকন যোগ করে `package.json`-এ পাথ দিন |
| Android বিল্ড ফেল, `mipmap` এরর | লঞ্চার আইকন সেট নেই | ডিফল্ট mipmap আইকন সেট যোগ করুন |
| লাইসেন্স কী "INVALID_KEY" দেখাচ্ছে | ফরম্যাট ভুল বা checksum না মেলা | `Admin_License_Generator.html` দিয়ে নতুন কী জেনারেট করে হুবহু কপি-পেস্ট করুন (স্পেস/এক্সট্রা ক্যারেক্টার ছাড়া) |
| লাইসেন্স কী "WRONG_DEVICE" দেখাচ্ছে | কী অন্য ডিভাইসে আগে অ্যাক্টিভেট করা হয়েছে | ওই ডিভাইসের জন্য আলাদা কী জেনারেট করুন |

---

## আরও দেখুন

- **কমান্ড রেফারেন্স:** `SABRE_COMMANDS_CHEATSHEET.md`
- **ক্লাস লেকচার শিট:** `STUDENT_TRAINING_LECTURE_SHEET.md`
- **প্রজেক্ট ওভারভিউ ও রোডম্যাপ:** `README.md`
