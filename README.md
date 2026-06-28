# 🛍️ ShopExplorer

Aplikasi katalog produk e-commerce berbasis React Native Expo menggunakan FakeStore API.

## API
FakeStore API — `https://fakestoreapi.com/products`

## Fitur
- ✅ Fetch data dengan async/await + try/catch/finally
- ✅ 3 kondisi UI: Loading (Skeleton) · Error + Retry · Success
- ✅ FlatList dengan gambar, judul, harga, rating, kategori
- ✅ Search / Filter lokal
- ✅ Layar Detail (modal) — tap kartu untuk lihat detail lengkap
- ✅ Empty State — tampilan ramah saat hasil pencarian kosong
- ✅ Skeleton Loading — placeholder animasi saat data dimuat
- ✅ Favorit lokal — simpan favorit dengan AsyncStorage

## Screenshot
| Loading | Success | Error |
|---------|---------|-------|
| ![loading](assets/LOADING%201.jpeg) | ![success](assets/success%202.jpeg) | ![error](assets/eror%203.jpeg) |

## Cara Menjalankan
```bash
npx create-expo-app@latest build-your-own-api-app --template blank@sdk-54
cd build-your-own-api-app
npx expo install @react-native-async-storage/async-storage
npx expo start
```
Ganti isi `App.js` dengan kode dari repo ini, lalu scan QR di Expo Go.

## Tech Stack
React Native · Expo SDK 54 · FakeStore API · AsyncStorage

## Link
- GitHub: https://github.com/mayumisarisitanggang-eng/build-your-own-api-app.git
- Expo Snack:https://snack.expo.dev/@maayumi.s/build-your-own-api-app?platform=web
