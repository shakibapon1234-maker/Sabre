# Sabre Training Simulator — Student Command Sheet

> এটি শিক্ষামূলক simulator-এর command guide; live Sabre GDS নয়। সব command বড় হাতের অক্ষরে লিখে Enter চাপুন।

## এক নজরে সম্পূর্ণ booking-to-ticket flow

```text
120JANDACSIN
0Y1
-RAHMAN/ANIS MR
9DAC 01700000000-A
WPA SQ
PQ
6S
ER
IR
W*BD
DSIVE8C987
PTR/E8C987
W¥PQ1¥ASQ¥FINVAGT¥K7
*T
```

## Keyboard mapping

| Key | কী হবে | ব্যবহার |
|---|---|---|
| `+` বা `=` | `*` (Display) | `*R`, `*PQ`, `*T` লিখতে |
| Enter-এর বাঁ পাশের quote/backslash key | `¥` (Cross of Lorraine) | এক entry-তে item আলাদা করতে |
| Enter | command পাঠায় | প্রতিটি entry চালাতে |

## Search, availability ও sell

| Command | ব্যবহার | উদাহরণ |
|---|---|---|
| `W/-<CITY/CODE>` | airport/city code খোঁজে বা decode করে | `W/-DAC`, `W/-DHAKA` |
| `W/-COUNTRIES` | training country-code list | `W/-COUNTRIES` |
| `1<DDMMM><FROM><TO>` | নির্দিষ্ট দিনের flight availability | `120JANDACSIN` |
| `0<CLASS><LINE>` | availability-এর flight/class sell | `0Y1` |
| `*I` / `*ITN` | itinerary display | `*I` |

আগে availability না দেখিয়ে sell করা যাবে না। Connection sell করলে সব legs একসঙ্গে PNR-এ যোগ হয়।

## Name entry — Adult, Child ও Infant

| Passenger | Command format | উদাহরণ | ফল |
|---|---|---|---|
| Adult | `-SURNAME/FIRSTNAME TITLE` | `-RAHMAN/ANIS MR` | Adult যোগ হয় |
| দ্বিতীয় adult | একই format আবার দিন | `-KHAN/SUMI MS` | passenger `1.2` হবে |
| Child | `-SURNAME/FIRSTNAME CHD/DDMMMYY` | `-RAHMAN/RIFAT CHD/15JAN15` | CHD ও DOB যোগ হয় |
| Child (বিকল্প) | `-SURNAME/FIRSTNAME CNN/DDMMMYY` | `-RAHMAN/RIFAT CNN/15JAN15` | CHD হিসেবে নেওয়া হয় |
| Infant | `-SURNAME/FIRSTNAME*I/DDMMMYY` | `-RAHMAN/BABY*I/20JAN25` | INF ও DOB যোগ হয় |
| Name display | `*- ` / `*N` | `*N` | সব name দেখায় |

Passenger reference: প্রথম নাম `P1`/`1.1`, দ্বিতীয় `P2`/`1.2`, তৃতীয় `P3`/`1.3`।

## Contact, ticketing ও received-from

| Command | ব্যবহার | উদাহরণ |
|---|---|---|
| `9<CITY> <NUMBER>-<TYPE>` | phone/contact field | `9DAC 01700000000-A` |
| `*P` / `*9` | phones display | `*P` |
| `7TAW-<DDMMM>/` | ticket time limit | `7TAW-24SEP/` |
| `*7` | time limit display | `*7` |
| `6<NAME>` | received from | `6S` বা `6SHAKIB` |
| `*6` | received from display | `*6` |

## SSR: meal, wheelchair ও contacts

| Command | ব্যবহার | উদাহরণ |
|---|---|---|
| `3<SSR>/P<PAX>` | passenger-specific SSR | `3VGML/P2` |
| `3CTCM/<MOBILE>/P<PAX>` | mobile contact | `3CTCM/01757208244/P1` |
| `3CTCE/<EMAIL>/P<PAX>` | email contact; `@`-এর বদলে `//` | `3CTCE/SHAKIBAPON//GMAIL.COM/P2` |
| `3MOML-<PAX>` | Muslim meal | `3MOML-1` |
| `3WCHR/<DETAIL>/P<PAX>` | wheelchair SSR | `3WCHR/ELDERLY AGED/P3` |
| `*SSR` / `*3` | SSR display | `*SSR` |

`P1/P2` ভুল হলে simulator warning দেয়।

## Passport / DOCS SSR

| Command | ব্যবহার | উদাহরণ |
|---|---|---|
| `3DOCS/...-1.<PAX>` | passport/APIS information যোগ করে | `3DOCS/P/BD/A3863636/BD/20MAY95/M/30JUN32/RAHMAN/ANIS-1.1` |
| `*P3D` | passenger documents display | `*P3D` |

দ্বিতীয় passenger-এর জন্য শেষে `-1.2`, তৃতীয় জনের জন্য `-1.3` ব্যবহার করুন।

## Fare quote ও PQ

| Command | ব্যবহার | উদাহরণ |
|---|---|---|
| `WPA <AIRLINE>` | carrier অনুযায়ী fare load | `WPA SQ`, `WPA MH` |
| `PQ` | PQ প্রস্তুত করে | `PQ` |
| `*PQ` / `3PQ` | full PQ/fare record | `*PQ` |
| `WPNCB` / `WPNI` | booked airline দিয়ে fare quote | `WPNCB` |

Multi-passenger training calculation: ADT 100%, CHD 75%, INF 10%। `*PQ`-তে breakdown দেখা যায়।

## Save, redisplay ও retrieve

| Command | ব্যবহার | উদাহরণ |
|---|---|---|
| `E` | PNR end/save | `E` |
| `ER` | save ও সঙ্গে সঙ্গে redisplay | `ER` |
| `IR` | saved PNR redisplay | `IR` |
| `*R` | current PNR display | `*R` |
| `*<LOCATOR>` | locator দিয়ে retrieve | `*K7QZLM` |
| `XI` | unsaved work clear | `XI` |

## Printer assignment — issue-এর আগে একবার

| ধাপ | Command | Expected response |
|---|---|---|
| 1 | `W*BD` | `OK-0008` |
| 2 | `DSIV<PRINTER ID>` | `OK PTR ASSIGNED` |
| 3 | `PTR/<PRINTER ID>` | `PRINTER DESIGNATED` |

```text
W*BD
DSIVE8C987
PTR/E8C987
```

`DSIV` fixed, কিন্তু printer ID পরিবর্তন হতে পারে। নতুন app session হলে আবার assign করুন।

## Ticket issue ও ticket display

| Command | ব্যবহার | উদাহরণ |
|---|---|---|
| `WT` / `WTP` | training e-ticket issue | `WTP` |
| `W¥PQ1¥ASQ¥FINVAGT¥K7` | invoice/accounting সহ issue flow | `W¥PQ1¥ASQ¥FINVAGT¥K7` |
| `*T` | issued ticket ও time limit display | `*T` |

Issue-এর আগে PNR saved, fare/PQ ready এবং printer designated থাকতে হবে। একাধিক passenger হলে `*T`-তে প্রত্যেকের ticket line আলাদা আসে।

## দ্রুত display reference

| কী দেখতে চান | Command |
|---|---|
| Current PNR | `*R` |
| Names | `*N` / `*-` |
| Itinerary | `*I` |
| Phones | `*P` / `*9` |
| Time limit | `*7` |
| Received from | `*6` |
| SSR | `*SSR` / `*3` |
| Documents | `*P3D` |
| PQ/fare record | `*PQ` |
| Issued ticket | `*T` |

## গুরুত্বপূর্ণ মনে রাখবেন

1. `ER` দেওয়ার আগে অন্তত একটি name ও একটি flight segment থাকতে হবে।
2. SSR/DOCS দেওয়ার আগে passenger name insert করুন।
3. `IR` saved PNR redisplay করে; `XI` unsaved work clear করে।
4. Fare, printer ও e-ticket output শুধুই training simulation।
