# Sabre Training Simulator

**Wings Fly Aviation Academy** — Sabre GDS (Global Distribution System) শেখার জন্য একটা অফলাইন, ব্রাউজার/ডেস্কটপ/অ্যান্ড্রয়েড-ভিত্তিক ট্রেনিং সিমুলেটর। ইন্টারফেস ও কমান্ড ফরম্যাট বাস্তব **Sabre Red Workspace**-এর আদলে বানানো হয়েছে, যাতে শিক্ষার্থীরা কোনো লাইভ GDS-এর ঝুঁকি ছাড়াই এন্ট্রি প্র্যাকটিস করতে পারে।

> ⚠️ **ডিসক্লেইমার:** এটি একটি স্বাধীন এডুকেশনাল টুল। Sabre Corporation বা এর কোনো পণ্যের সাথে এই প্রজেক্টের কোনো অ্যাফিলিয়েশন, স্পনসরশিপ বা অনুমোদন নেই। এই সিমুলেটর কোনো লাইভ GDS নেটওয়ার্কের সাথে সংযুক্ত নয় — সব ফ্লাইট/PNR ডেটা লোকালি জেনারেট করা হয়, শুধুমাত্র প্রশিক্ষণের উদ্দেশ্যে।

---

## ফিচার

- **বাস্তবসম্মত টার্মিনাল UI** — OS টাইটেল বার, মেনু বার, ব্র্যান্ড স্ট্রিপ, লেটার্ড ওয়ার্কস্পেস ট্যাব, নেভি/টিল কালার স্কিম, F-key বার — সব Sabre Red Workspace-এর লুক অনুসরণ করে।
- **Phase 1 কমান্ড সেট (বুকিং → ইস্যু)**: এয়ারপোর্ট এনকোড/ডিকোড, এভেইলিবিলিটি, সেল, নাম/ফোন/রিসিভড-ফ্রম ফিল্ড, টিকেটিং অ্যারেঞ্জমেন্ট, SSR, এন্ড ট্রানজেকশন, প্রাইস কোট, ইস্যু, রিট্রিভ/রিডিসপ্লে/ইগনোর।
- **রিয়েলিস্টিক ফ্লাইট শিডিউল জেনারেটর** — সিডেড PRNG দিয়ে, একই রুট+তারিখ একই সেশনে একই শিডিউল দেখায়; রুটের রিজিয়ন অনুযায়ী ডিরেক্ট বা হাব-ভিত্তিক কানেকশন তৈরি করে (৫৫+ এয়ারপোর্ট, ২০টা এয়ারলাইন)।
- **মাল্টি-সেগমেন্ট ও মাল্টি-প্যাসেঞ্জার বুকিং সাপোর্ট।**
- **Command Helper পপআপ** — বাটন, `HELP`/`?`, বা F-key দিয়ে খোলা যায়।
- **Sabre-স্টাইল এরর মেসেজিং** (ALL CAPS, dash-separated) — ভুল কোড, না-পাওয়া availability, invalid pax reference ইত্যাদি হ্যান্ডল করে।
- **Lesson PNR কুইক-লোড** (`K7QZLM`) — এক ক্লিকে ডেমো PNR লোড হয়।
- **তিনটা ডেলিভারি মোড**: ব্রাউজার, Electron ডেস্কটপ অ্যাপ, Android APK — তিনটাতেই একই ইঞ্জিন।
- **লাইসেন্সিং/সিকিউরিটি সিস্টেম** (Android) — ডিভাইস-বাইন্ড লাইসেন্স কী, tamper-detection, স্ক্রিনশট/রেকর্ডিং ব্লক, অ্যাডমিন লাইসেন্স জেনারেটর।

---

## প্রজেক্ট স্ট্রাকচার

```
sabre/
├── index.html                     # মূল টার্মিনাল UI (ব্রাউজার + ডেস্কটপ + Android শেয়ার্ড)
├── js/
│   ├── sb-airports.js             # এয়ারপোর্ট/এয়ারলাইন/হাব ডেটা
│   ├── sb-availability.js         # ফ্লাইট শিডিউল জেনারেটর
│   ├── sb-pnr.js                  # state ম্যানেজমেন্ট, রেন্ডারিং, লেসন PNR
│   ├── sb-commands.js             # কমান্ড পার্সার ও হ্যান্ডলার
│   └── sb-app.js                  # UI init, টার্মিনাল হুকআপ, Command Helper
├── main.js                        # Electron main process
├── package.json                   # Electron/electron-builder কনফিগ
├── Start_Desktop.bat              # ডেস্কটপ লঞ্চার (npm install অটো-চেক)
├── Start.bat                      # এক-ক্লিক ডেস্কটপ স্টার্টার
├── SABRE_COMMANDS_CHEATSHEET.md   # কমান্ড রেফারেন্স
├── android/                       # Android Gradle প্রজেক্ট
│   ├── app/src/main/java/…/MainActivity.java  # WebView host; account/device gate is in js/auth.js
│   ├── app/src/main/assets/www/   # index.html + js/ (সিঙ্কড কপি)
│   └── app/src/main/AndroidManifest.xml
├── Build_APK.bat                  # assets sync + gradlew assembleRelease
└── Start_APK.bat                  # adb install + launch
```

---

## সেটআপ

### ১. ব্রাউজারে (দ্রুততম, কোনো ইনস্টল লাগে না)
`sabre/index.html` ফাইলটা যেকোনো মডার্ন ব্রাউজারে (Chrome/Edge/Firefox) সরাসরি ওপেন করলেই চলবে।

### ২. Electron ডেস্কটপ অ্যাপ (Windows)
```
cd sabre
npm install
npm start
```
অথবা `Start.bat` ডাবল-ক্লিক করুন — এটি প্রয়োজন হলে `npm install` চালিয়ে Electron ডেস্কটপ অ্যাপ খুলবে। সরাসরি `Start_Desktop.bat`-ও ব্যবহার করা যায়।

**ইনস্টলার/পোর্টেবল বিল্ড বানাতে:**
```
npm run build-win        # NSIS ইনস্টলার (ia32 + x64)
npm run build-portable   # পোর্টেবল .exe
```

### ৩. Android APK
```
cd sabre/android
gradlew assembleRelease
```
অথবা রুট থেকে `Build_APK.bat` চালান (এটা প্রথমে `js/` ও `index.html` কে `android/app/src/main/assets/www/`-এ সিঙ্ক করে, তারপর `gradlew assembleRelease` চালায়)। এমুলেটর/ডিভাইসে ইনস্টল ও রান করতে `Start_APK.bat` ব্যবহার করুন।

**Android access:** the APK uses the same Supabase account and device-limit gate as the web and desktop versions. Apply `SUPABASE_SETUP.md` before distributing an APK.

---

## GitHub Pages / Vercel-এ ডিপ্লয় (ব্রাউজার ভার্সন)

শুধু `index.html` ও `js/` ফোল্ডার লাগবে — `main.js`, `package.json`, `android/` স্ট্যাটিক হোস্টিং-এ দরকার নেই।

**GitHub Pages:**
1. এই রিপো GitHub-এ পুশ করুন (অথবা `index.html` + `js/` আলাদা রিপোতে রাখুন)।
2. রিপো Settings → Pages → Source-এ `main` ব্রাঞ্চ (রুট বা `/sabre` ফোল্ডার) সিলেক্ট করুন।
3. `https://<username>.github.io/<repo>/index.html` লিংকে অ্যাক্সেস করা যাবে।

**Vercel:**
1. রিপো Vercel-এ ইম্পোর্ট করুন।
2. Framework preset: **Other** / Static; Root Directory: `sabre` (যেখানে `index.html` আছে)।
3. Build command খালি রাখুন, Output directory `.` দিন — ডিপ্লয় করলেই লাইভ লিংক পাবেন।

কোনো ব্যাকএন্ড/সার্ভার লাগে না — পুরো ইঞ্জিন ক্লায়েন্ট-সাইড JavaScript-এ চলে, তাই যেকোনো স্ট্যাটিক হোস্ট (Netlify, Cloudflare Pages ইত্যাদি) দিয়েও কাজ করবে।

---

## কমান্ড রেফারেন্স

সম্পূর্ণ বুকিং-টু-ইস্যু কমান্ড সিকোয়েন্স, উদাহরণসহ, `SABRE_COMMANDS_CHEATSHEET.md` ফাইলে দেওয়া আছে।

---

## রোডম্যাপ

- ✅ Phase A — কমান্ড ইঞ্জিন হার্ডেনিং, মডিউল স্প্লিট
- ✅ Phase B — Electron ডেস্কটপ wrapper
- ✅ Phase C — Android অ্যাপ + লাইসেন্সিং সিস্টেম
- ✅ Phase D — Admin License Generator
- 🔄 Phase E — ডকুমেন্টেশন (README ✅, SETUP_GUIDE ✅, STUDENT_TRAINING_LECTURE_SHEET বাকি)
- ⏳ Phase F — Refund/Reissue, Fare shop, Seat map (ভবিষ্যতে, Amadeus সিমুলেটরের সাথে একসাথে শুরু হবে)

---

## লাইসেন্স

MIT — © 2026 Wings Fly Aviation Academy। এই সফটওয়্যার শুধুমাত্র শিক্ষামূলক উদ্দেশ্যে; বাস্তব GDS বুকিং/টিকেটিং-এর জন্য ব্যবহারযোগ্য নয়।
