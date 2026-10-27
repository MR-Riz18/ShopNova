/**
 * Database seed script for the e-commerce backend.
 *
 * Run from the server directory:
 *   npm run seed        (package.json: "seed": "node seed/seed.js")
 *
 * What it does:
 *  1. Connects to MongoDB (MONGO_URI from server/.env)
 *  2. Wipes User, Category, Product, Review, Coupon, Cart, Wishlist, Order
 *  3. Seeds 6 users, 6 categories, 32 products, 24 reviews, 3 coupons
 *  4. Recomputes product ratings from the reviews, prints a summary, exits
 *
 * Notes:
 *  - Users are created with User.create() so the pre-save hook hashes passwords.
 *  - Categories/Products are created with Model.create() so the pre-save hooks
 *    generate slugs. Product.discount is computed from price / originalPrice.
 *  - Prices are in PKR (Rs). Images use picsum.photos seed URLs.
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoose = require('mongoose');

const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Review = require('../models/Review');
const Coupon = require('../models/Coupon');
const Cart = require('../models/Cart');
const Wishlist = require('../models/Wishlist');
const Order = require('../models/Order');

const ADMIN_EMAIL = 'admin@shop.com';
const ADMIN_PASSWORD = 'Admin123!';
const DEMO_EMAIL = 'user@shop.com';
const DEMO_PASSWORD = 'User123!';

/* ------------------------------------------------------------------ */
/* Seed data                                                           */
/* ------------------------------------------------------------------ */

const usersData = [
  { username: 'Admin', email: ADMIN_EMAIL, password: ADMIN_PASSWORD, role: 'admin' },
  { username: 'Demo User', email: DEMO_EMAIL, password: DEMO_PASSWORD, role: 'user', phone: '03001234567' },
  { username: 'Ahmed Khan', email: 'ahmed@test.com', password: 'User123!', role: 'user' },
  { username: 'Fatima Ali', email: 'fatima@test.com', password: 'User123!', role: 'user' },
  { username: 'Bilal Ahmed', email: 'bilal@test.com', password: 'User123!', role: 'user' },
  { username: 'Ayesha Malik', email: 'ayesha@test.com', password: 'User123!', role: 'user' },
];

const categoriesData = [
  { name: "Men's Fashion", description: 'Shirts, jeans, kurtas, and everyday essentials for men.' },
  { name: "Women's Fashion", description: 'Trendy eastern and western wear for women.' },
  { name: 'Electronics', description: 'Smartphones, laptops, audio devices, and smart gadgets.' },
  { name: 'Shoes', description: 'Sneakers, formal shoes, heels, and comfortable sandals.' },
  { name: 'Accessories', description: 'Watches, wallets, bags, sunglasses, and more.' },
  { name: 'Home & Lifestyle', description: 'Home decor, bedding, kitchenware, and living essentials.' },
];

/* Flags: featured / bestSeller / isNew (only true flags are listed). */
const productsData = [
  // ------------------------- Men's Fashion -------------------------
  {
    name: 'Classic Oxford Cotton Shirt',
    brand: 'Gul Ahmed',
    price: 2899,
    originalPrice: 3499,
    stock: 120,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['White', 'Light Blue', 'Navy'],
    category: "Men's Fashion",
    featured: true,
    description:
      'A timeless wardrobe essential cut from breathable combed cotton oxford fabric. The button-down collar and regular fit keep it sharp for the office yet relaxed for evenings out. Pairs effortlessly with denim or chinos for a polished smart-casual look.',
    specifications: [
      { key: 'Material', value: '100% combed cotton oxford' },
      { key: 'Fit', value: 'Regular fit' },
      { key: 'Collar', value: 'Button-down' },
      { key: 'Care', value: 'Machine washable' },
      { key: 'Sleeve', value: 'Full sleeves with button cuffs' },
    ],
  },
  {
    name: 'Slim-Fit Stretch Denim Jeans',
    brand: "Levi's",
    price: 4499,
    originalPrice: null,
    stock: 85,
    sizes: ['30', '32', '34', '36'],
    colors: ['Dark Blue', 'Black', 'Light Blue'],
    category: "Men's Fashion",
    bestSeller: true,
    description:
      'Cut from premium stretch denim with a modern slim fit that sits comfortably through the hip and thigh. The mid-rise waist and tapered leg create a clean, contemporary silhouette. A versatile everyday pair that only gets better with wear.',
    specifications: [
      { key: 'Material', value: '98% cotton, 2% elastane' },
      { key: 'Fit', value: 'Slim fit, mid rise' },
      { key: 'Closure', value: 'Zip fly with button' },
      { key: 'Care', value: 'Machine wash cold' },
      { key: 'Pockets', value: 'Classic 5-pocket styling' },
    ],
  },
  {
    name: 'Premium Pique Polo T-Shirt',
    brand: 'Sapphire',
    price: 1999,
    originalPrice: 2499,
    stock: 200,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Black', 'White', 'Olive', 'Maroon'],
    category: "Men's Fashion",
    isNew: true,
    description:
      'A classic pique polo knitted from soft, breathable cotton for all-day comfort. The ribbed collar and two-button placket keep the look crisp from workdays to weekends. A smart layer that works tucked in or left out.',
    specifications: [
      { key: 'Material', value: '100% cotton pique knit' },
      { key: 'Fit', value: 'Regular fit' },
      { key: 'Collar', value: 'Ribbed polo collar' },
      { key: 'Care', value: 'Machine washable' },
      { key: 'Placket', value: 'Two-button' },
    ],
  },
  {
    name: 'Single-Breasted Formal Blazer',
    brand: 'Diners',
    price: 9999,
    originalPrice: null,
    stock: 30,
    sizes: ['M', 'L', 'XL'],
    colors: ['Charcoal', 'Navy'],
    category: "Men's Fashion",
    description:
      'A sharply tailored single-breasted blazer with a structured shoulder and clean notch lapels. The half-canvassed construction drapes beautifully for weddings, meetings, and formal dinners. A power piece every wardrobe deserves.',
    specifications: [
      { key: 'Material', value: 'Polyester-viscose blend' },
      { key: 'Fit', value: 'Tailored fit' },
      { key: 'Lapel', value: 'Notch lapel' },
      { key: 'Closure', value: 'Two-button front' },
      { key: 'Lining', value: 'Fully lined interior' },
    ],
  },
  {
    name: 'Embroidered Festive Kurta',
    brand: 'Khaadi',
    price: 3799,
    originalPrice: 4599,
    stock: 95,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['White', 'Beige', 'Black'],
    category: "Men's Fashion",
    featured: true,
    bestSeller: true,
    description:
      'A festive-ready kurta with delicate tonal embroidery along the placket and cuffs. Cut from airy cotton in a relaxed straight fit, it keeps you comfortable through long Eid gatherings and wedding functions. Pair with a white shalwar or slim trousers to complete the look.',
    specifications: [
      { key: 'Material', value: '100% breathable cotton' },
      { key: 'Fit', value: 'Straight, relaxed fit' },
      { key: 'Embroidery', value: 'Neckline placket and cuffs' },
      { key: 'Care', value: 'Gentle machine wash' },
      { key: 'Length', value: 'Knee-length' },
    ],
  },
  {
    name: 'Fleece Pullover Hoodie',
    brand: 'Outfitters',
    price: 2499,
    originalPrice: null,
    stock: 150,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Grey', 'Black', 'Navy'],
    category: "Men's Fashion",
    isNew: true,
    description:
      'A cozy pullover hoodie in brushed-back fleece that traps warmth without the bulk. The double-lined hood, kangaroo pocket, and ribbed cuffs make it the go-to layer for chilly evenings. Perfect for lounging, gym runs, or layering under a jacket.',
    specifications: [
      { key: 'Material', value: 'Cotton-polyester fleece' },
      { key: 'Fit', value: 'Relaxed fit' },
      { key: 'Hood', value: 'Double-lined drawstring hood' },
      { key: 'Care', value: 'Machine washable' },
      { key: 'Pocket', value: 'Kangaroo pocket' },
    ],
  },
  // ------------------------ Women's Fashion ------------------------
  {
    name: 'Embroidered Lawn 3-Piece Suit',
    brand: 'Khaadi',
    price: 5499,
    originalPrice: 6999,
    stock: 70,
    sizes: ['S', 'M', 'L'],
    colors: ['Mint', 'Peach', 'Lavender'],
    category: "Women's Fashion",
    featured: true,
    bestSeller: true,
    description:
      'A breezy three-piece lawn suit featuring intricate embroidery on the shirt front with a printed chiffon dupatta. The lightweight cambric trousers keep it comfortable through warm summer days. Ideal for daytime events, lunches, and festive gatherings.',
    specifications: [
      { key: 'Material', value: 'Premium lawn with chiffon dupatta' },
      { key: 'Pieces', value: 'Shirt, trousers, dupatta' },
      { key: 'Fit', value: 'Regular fit, straight trousers' },
      { key: 'Care', value: 'Gentle machine wash' },
      { key: 'Embroidery', value: 'Front panel and sleeves' },
    ],
  },
  {
    name: 'Chiffon Evening Maxi Dress',
    brand: 'Sapphire',
    price: 7299,
    originalPrice: null,
    stock: 40,
    sizes: ['XS', 'S', 'M', 'L'],
    colors: ['Emerald', 'Black', 'Wine'],
    category: "Women's Fashion",
    description:
      'An elegant floor-sweeping maxi in flowing chiffon with a flattering empire waist. The soft lining and graceful drape move beautifully at evening soirees and formal dinners. A statement piece that needs little more than heels and confidence.',
    specifications: [
      { key: 'Material', value: 'Chiffon with soft lining' },
      { key: 'Fit', value: 'Empire waist, flowing skirt' },
      { key: 'Length', value: 'Full-length maxi' },
      { key: 'Care', value: 'Dry clean recommended' },
      { key: 'Neckline', value: 'Round neck' },
    ],
  },
  {
    name: 'Casual Summer Printed Top',
    brand: 'Gul Ahmed',
    price: 1799,
    originalPrice: 2299,
    stock: 180,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Floral Print', 'White'],
    category: "Women's Fashion",
    isNew: true,
    description:
      'A light, airy summer top in breathable printed lawn with an easy relaxed silhouette. The cheerful prints and comfortable fit make it a daily staple for hot weather. Tuck it into jeans or pair with palazzos for effortless style.',
    specifications: [
      { key: 'Material', value: '100% lawn cotton' },
      { key: 'Fit', value: 'Relaxed fit' },
      { key: 'Sleeve', value: 'Short sleeves' },
      { key: 'Care', value: 'Machine washable' },
      { key: 'Print', value: 'All-over floral' },
    ],
  },
  {
    name: 'Classic Denim Trucker Jacket',
    brand: "Levi's",
    price: 5999,
    originalPrice: null,
    stock: 55,
    sizes: ['S', 'M', 'L'],
    colors: ['Blue Denim', 'Black Denim'],
    category: "Women's Fashion",
    description:
      'The iconic trucker jacket in rugged mid-weight denim with classic flap pockets. Its timeless cut layers perfectly over tees and hoodies through every season. A forever piece that anchors any casual wardrobe.',
    specifications: [
      { key: 'Material', value: '100% cotton denim' },
      { key: 'Fit', value: 'Regular trucker fit' },
      { key: 'Closure', value: 'Button front' },
      { key: 'Care', value: 'Machine wash cold' },
      { key: 'Details', value: 'Chest flap pockets' },
    ],
  },
  {
    name: 'Premium Chiffon Hijab Scarf',
    brand: 'Modest Wear',
    price: 999,
    originalPrice: null,
    stock: 300,
    sizes: ['Free Size'],
    colors: ['Black', 'Beige', 'Dusty Rose', 'White'],
    category: "Women's Fashion",
    bestSeller: true,
    description:
      'A featherlight chiffon hijab with a soft matte finish that drapes beautifully and stays in place. Generously sized for full coverage with an elegant, breathable feel. An everyday essential in versatile neutral shades.',
    specifications: [
      { key: 'Material', value: 'Premium chiffon' },
      { key: 'Size', value: 'Approx. 70 x 180 cm' },
      { key: 'Finish', value: 'Matte, non-slip weave' },
      { key: 'Care', value: 'Hand wash' },
      { key: 'Style', value: 'Rectangular wrap' },
    ],
  },
  {
    name: 'Floral Summer Maxi Dress',
    brand: 'Sapphire',
    price: 4299,
    originalPrice: null,
    stock: 65,
    sizes: ['S', 'M', 'L'],
    colors: ['Yellow Floral', 'Blue Floral'],
    category: "Women's Fashion",
    isNew: true,
    description:
      'A sunshine-ready maxi dress in breezy printed fabric with a smocked back for a flexible, comfortable fit. The tiered skirt sways with every step, perfect for brunches, beach days, and summer weddings. Lightweight, feminine, and endlessly wearable.',
    specifications: [
      { key: 'Material', value: 'Soft rayon blend' },
      { key: 'Fit', value: 'Smocked back, relaxed waist' },
      { key: 'Length', value: 'Ankle-length' },
      { key: 'Care', value: 'Gentle machine wash' },
      { key: 'Details', value: 'Tiered skirt' },
    ],
  },
  // --------------------------- Electronics ---------------------------
  {
    name: 'True Wireless Bluetooth Earbuds',
    brand: 'Anker',
    price: 7999,
    originalPrice: 9999,
    stock: 110,
    sizes: [],
    colors: ['Black', 'White'],
    category: 'Electronics',
    featured: true,
    bestSeller: true,
    description:
      'Punchy, detailed sound with hybrid active noise cancellation and deep-bass drivers. Up to 32 hours of total playtime with the pocketable charging case keeps the music going all week. Touch controls and a low-latency mode make them perfect for work and play.',
    specifications: [
      { key: 'Driver', value: '10mm dynamic drivers' },
      { key: 'Battery', value: '8 hrs + 24 hrs with case' },
      { key: 'Connectivity', value: 'Bluetooth 5.3' },
      { key: 'Noise Cancellation', value: 'Hybrid ANC' },
      { key: 'Rating', value: 'IPX5 water resistant' },
    ],
  },
  {
    name: 'Galaxy A-Series Smartphone 128GB',
    brand: 'Samsung',
    price: 54999,
    originalPrice: null,
    stock: 45,
    sizes: [],
    colors: ['Black', 'Blue', 'Silver'],
    category: 'Electronics',
    featured: true,
    description:
      'A stunning Super AMOLED display, versatile 50MP triple camera, and all-day 5000mAh battery in one sleek package. Smooth 120Hz refresh and 5G connectivity keep everything fast and fluid. The perfect balance of flagship features and value.',
    specifications: [
      { key: 'Display', value: '6.5-inch Super AMOLED, 120Hz' },
      { key: 'Camera', value: '50MP triple rear camera' },
      { key: 'Storage', value: '128GB + 8GB RAM' },
      { key: 'Battery', value: '5000mAh, 25W fast charging' },
      { key: 'OS', value: 'Android with 4 years of updates' },
    ],
  },
  {
    name: '15.6" Core i5 Laptop (8GB/512GB)',
    brand: 'HP',
    price: 149999,
    originalPrice: null,
    stock: 20,
    sizes: [],
    colors: ['Silver'],
    category: 'Electronics',
    description:
      'A dependable everyday laptop powered by an Intel Core i5 processor with speedy 512GB SSD storage. The 15.6-inch Full HD display and backlit keyboard make work and study comfortable anywhere. Slim, sturdy, and ready for multitasking.',
    specifications: [
      { key: 'Processor', value: 'Intel Core i5 (13th Gen)' },
      { key: 'Memory', value: '8GB RAM, 512GB SSD' },
      { key: 'Display', value: '15.6-inch Full HD' },
      { key: 'Keyboard', value: 'Backlit' },
      { key: 'Battery', value: 'Up to 9 hours' },
    ],
  },
  {
    name: 'AMOLED Fitness Smart Watch',
    brand: 'Xiaomi',
    price: 9499,
    originalPrice: 11999,
    stock: 90,
    sizes: [],
    colors: ['Black', 'Blue'],
    category: 'Electronics',
    bestSeller: true,
    isNew: true,
    description:
      'Track your health around the clock with heart-rate, SpO2, and sleep monitoring on a vivid AMOLED display. Over 150 sport modes and 5ATM water resistance keep up with every workout. Up to 14 days of battery means less charging and more doing.',
    specifications: [
      { key: 'Display', value: '1.43-inch AMOLED' },
      { key: 'Battery', value: 'Up to 14 days' },
      { key: 'Water Resistance', value: '5ATM' },
      { key: 'Sensors', value: 'Heart rate, SpO2, sleep' },
      { key: 'Sport Modes', value: '150+' },
    ],
  },
  {
    name: 'Portable Bluetooth Speaker',
    brand: 'JBL',
    price: 12999,
    originalPrice: null,
    stock: 60,
    sizes: [],
    colors: ['Black', 'Blue', 'Red'],
    category: 'Electronics',
    description:
      'Big, bold signature sound in a rugged grab-and-go design with deep bass radiators. The IP67 waterproof and dustproof build with 20 hours of playtime is made for pool days and picnics. Pair two speakers for true wireless stereo.',
    specifications: [
      { key: 'Sound', value: 'Signature sound with deep bass' },
      { key: 'Battery', value: 'Up to 20 hours' },
      { key: 'Rating', value: 'IP67 waterproof' },
      { key: 'Connectivity', value: 'Bluetooth 5.3' },
      { key: 'Extras', value: 'Stereo pairing' },
    ],
  },
  {
    name: '20000mAh Fast-Charging Power Bank',
    brand: 'Anker',
    price: 4999,
    originalPrice: 6499,
    stock: 140,
    sizes: [],
    colors: ['Black', 'White'],
    category: 'Electronics',
    description:
      'A high-capacity 20000mAh power bank with 22.5W fast charging for phones, earbuds, and tablets. The smart digital display shows remaining power at a glance. Compact enough for the daily commute, powerful enough for long trips.',
    specifications: [
      { key: 'Capacity', value: '20000mAh' },
      { key: 'Output', value: '22.5W fast charging' },
      { key: 'Display', value: 'LED battery percentage' },
      { key: 'Ports', value: 'USB-C + 2x USB-A' },
      { key: 'Safety', value: 'Multi-protect circuit' },
    ],
  },
  // ------------------------------ Shoes ------------------------------
  {
    name: 'Air Zoom Running Shoes',
    brand: 'Nike',
    price: 18999,
    originalPrice: 22999,
    stock: 50,
    sizes: ['UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11'],
    colors: ['Black/White', 'Blue'],
    category: 'Shoes',
    featured: true,
    bestSeller: true,
    description:
      'Responsive Zoom Air cushioning and a breathable engineered-mesh upper deliver a springy, comfortable ride. The durable rubber outsole grips roads and tracks alike. Built for daily runners who want energy return mile after mile.',
    specifications: [
      { key: 'Cushioning', value: 'Zoom Air units' },
      { key: 'Upper', value: 'Engineered mesh' },
      { key: 'Outsole', value: 'Durable rubber' },
      { key: 'Use', value: 'Road running' },
      { key: 'Build', value: 'Lightweight' },
    ],
  },
  {
    name: 'Classic White Court Sneakers',
    brand: 'Adidas',
    price: 14499,
    originalPrice: null,
    stock: 75,
    sizes: ['UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10'],
    colors: ['White'],
    category: 'Shoes',
    description:
      'A clean court classic in premium leather with timeless three-stripe detailing. The cushioned insole and grippy cupsole keep comfort high from morning to night. The white sneaker that goes with literally everything.',
    specifications: [
      { key: 'Upper', value: 'Full-grain leather' },
      { key: 'Sole', value: 'Rubber cupsole' },
      { key: 'Insole', value: 'Cushioned' },
      { key: 'Style', value: 'Low-top court' },
      { key: 'Care', value: 'Wipe clean' },
    ],
  },
  {
    name: 'Genuine Leather Formal Oxfords',
    brand: 'Hush Puppies',
    price: 8999,
    originalPrice: null,
    stock: 35,
    sizes: ['UK 7', 'UK 8', 'UK 9', 'UK 10'],
    colors: ['Brown', 'Black'],
    category: 'Shoes',
    description:
      'Handcrafted genuine leather oxfords with a sleek closed-lace profile for the boardroom and beyond. Cushioned insoles and a flexible sole keep long days comfortable. A refined staple for suits and formal wear.',
    specifications: [
      { key: 'Upper', value: 'Genuine leather' },
      { key: 'Lining', value: 'Soft textile' },
      { key: 'Sole', value: 'Anti-slip rubber' },
      { key: 'Closure', value: 'Closed lacing' },
      { key: 'Care', value: 'Polish regularly' },
    ],
  },
  {
    name: 'Block-Heel Party Pumps',
    brand: 'Stylo',
    price: 3499,
    originalPrice: null,
    stock: 80,
    sizes: ['UK 5', 'UK 6', 'UK 7', 'UK 8'],
    colors: ['Nude', 'Black', 'Red'],
    category: 'Shoes',
    isNew: true,
    description:
      'Chic block-heel pumps with a comfortable mid height you can actually dance in. The cushioned footbed and secure fit keep you party-ready from dinner to the dance floor. An instant lift for dresses and festive outfits.',
    specifications: [
      { key: 'Heel', value: '2.5-inch block heel' },
      { key: 'Upper', value: 'Synthetic leather' },
      { key: 'Insole', value: 'Cushioned footbed' },
      { key: 'Toe', value: 'Pointed' },
      { key: 'Occasion', value: 'Party and evening' },
    ],
  },
  {
    name: 'Comfort Slide Sandals',
    brand: 'Puma',
    price: 4299,
    originalPrice: 4999,
    stock: 100,
    sizes: ['UK 7', 'UK 8', 'UK 9', 'UK 10'],
    colors: ['Black', 'Navy'],
    category: 'Shoes',
    description:
      'Ultra-soft molded slides with a contoured footbed for all-day comfort. The water-friendly synthetic upper and grippy sole make them perfect poolside, post-workout, or for quick errands. Slip on and go.',
    specifications: [
      { key: 'Upper', value: 'Water-friendly synthetic' },
      { key: 'Footbed', value: 'Contoured comfort' },
      { key: 'Sole', value: 'Anti-slip rubber' },
      { key: 'Use', value: 'Casual and recovery' },
      { key: 'Care', value: 'Rinse clean' },
    ],
  },
  // ---------------------------- Accessories ----------------------------
  {
    name: 'Genuine Leather Bi-Fold Wallet',
    brand: 'Jafferjees',
    price: 2199,
    originalPrice: null,
    stock: 160,
    sizes: [],
    colors: ['Brown', 'Black'],
    category: 'Accessories',
    bestSeller: true,
    description:
      'A classic bi-fold wallet handcrafted from genuine leather that ages beautifully. With 8 card slots, two currency compartments, and a coin pocket, it keeps everything organized. Slim enough for any pocket, refined enough for any occasion.',
    specifications: [
      { key: 'Material', value: 'Genuine leather' },
      { key: 'Slots', value: '8 card slots' },
      { key: 'Compartments', value: '2 currency, 1 coin' },
      { key: 'Style', value: 'Bi-fold' },
      { key: 'Dimensions', value: '11 x 9 cm (folded)' },
    ],
  },
  {
    name: 'Classic Aviator Sunglasses',
    brand: 'Ray-Ban',
    price: 15999,
    originalPrice: 18999,
    stock: 40,
    sizes: [],
    colors: ['Gold/Green', 'Black'],
    category: 'Accessories',
    featured: true,
    description:
      'The original aviator with iconic teardrop lenses and 100 percent UV protection. The lightweight gold metal frame and classic green lenses deliver timeless style and crystal-clear vision. A legend that never goes out of fashion.',
    specifications: [
      { key: 'Lens', value: 'Classic green G-15' },
      { key: 'Protection', value: '100% UV' },
      { key: 'Frame', value: 'Gold metal' },
      { key: 'Shape', value: 'Aviator' },
      { key: 'Includes', value: 'Case and cleaning cloth' },
    ],
  },
  {
    name: 'Everyday Travel Backpack 25L',
    brand: 'Nike',
    price: 6499,
    originalPrice: null,
    stock: 70,
    sizes: [],
    colors: ['Black', 'Grey'],
    category: 'Accessories',
    description:
      'A versatile 25L backpack with a padded 15-inch laptop sleeve and multiple organizer pockets. The breathable back panel and adjustable straps keep commutes comfortable. Built tough for daily use, travel, and the gym.',
    specifications: [
      { key: 'Capacity', value: '25 litres' },
      { key: 'Laptop Sleeve', value: 'Padded 15-inch' },
      { key: 'Material', value: 'Durable polyester' },
      { key: 'Straps', value: 'Padded, adjustable' },
      { key: 'Extras', value: 'Side bottle pockets' },
    ],
  },
  {
    name: 'Vintage-Style Analog Watch',
    brand: 'Casio',
    price: 11499,
    originalPrice: null,
    stock: 45,
    sizes: [],
    colors: ['Silver', 'Black', 'Gold'],
    category: 'Accessories',
    description:
      'A vintage-inspired analog watch with a clean dial and dependable quartz movement. The slim profile sits comfortably under cuffs for office or evening wear. Understated elegance that works with everything.',
    specifications: [
      { key: 'Movement', value: 'Japanese quartz' },
      { key: 'Case', value: 'Stainless steel' },
      { key: 'Water Resistance', value: '30m' },
      { key: 'Strap', value: 'Adjustable' },
      { key: 'Display', value: 'Analog with date' },
    ],
  },
  {
    name: 'Quilted Chain-Strap Handbag',
    brand: 'Khaadi',
    price: 4999,
    originalPrice: 5999,
    stock: 55,
    sizes: [],
    colors: ['Beige', 'Black', 'Tan'],
    category: 'Accessories',
    isNew: true,
    description:
      'A chic quilted handbag with a luxe chain strap that dresses up any outfit. The structured silhouette holds your essentials, with an interior zip pocket for valuables. Perfect for dinners, events, and evenings out.',
    specifications: [
      { key: 'Material', value: 'Quilted synthetic leather' },
      { key: 'Strap', value: 'Chain with shoulder drop' },
      { key: 'Closure', value: 'Magnetic flap' },
      { key: 'Interior', value: 'Zip pocket' },
      { key: 'Dimensions', value: '24 x 16 x 8 cm' },
    ],
  },
  // -------------------------- Home & Lifestyle --------------------------
  {
    name: 'Scented Candle Gift Set (3 pc)',
    brand: 'Aroma House',
    price: 1899,
    originalPrice: null,
    stock: 120,
    sizes: [],
    colors: ['Vanilla', 'Lavender', 'Sandalwood'],
    category: 'Home & Lifestyle',
    isNew: true,
    description:
      'A trio of hand-poured scented candles in vanilla, lavender, and sandalwood for every mood. Each burns cleanly for up to 25 hours, filling your home with calming fragrance. Beautifully boxed, ready to gift or to keep.',
    specifications: [
      { key: 'Contents', value: '3 scented candles' },
      { key: 'Burn Time', value: 'Up to 25 hours each' },
      { key: 'Wax', value: 'Premium soy blend' },
      { key: 'Scents', value: 'Vanilla, Lavender, Sandalwood' },
      { key: 'Packaging', value: 'Gift box' },
    ],
  },
  {
    name: 'King-Size Cotton Bedsheet Set',
    brand: 'Gul Ahmed Home',
    price: 3999,
    originalPrice: 4999,
    stock: 90,
    sizes: ['King'],
    colors: ['White', 'Grey', 'Blue'],
    category: 'Home & Lifestyle',
    bestSeller: true,
    description:
      'A luxurious king-size bedsheet set in breathable 100 percent cotton with a smooth 300-thread-count weave. Includes a fitted sheet and two pillow covers for a complete bedroom refresh. Soft, durable, and kind to skin all night long.',
    specifications: [
      { key: 'Material', value: '100% cotton' },
      { key: 'Thread Count', value: '300 TC' },
      { key: 'Set', value: 'Fitted sheet + 2 pillow covers' },
      { key: 'Size', value: 'King' },
      { key: 'Care', value: 'Machine washable' },
    ],
  },
  {
    name: 'Ceramic Dinner Set - 24 Pieces',
    brand: 'TableCraft',
    price: 8499,
    originalPrice: 9999,
    stock: 25,
    sizes: [],
    colors: ['White', 'Ivory'],
    category: 'Home & Lifestyle',
    featured: true,
    description:
      'A complete 24-piece ceramic dinner set serving six, with dinner plates, side plates, bowls, and mugs. The glazed finish resists chipping and is microwave and dishwasher safe. Elevates everyday meals and festive dawats alike.',
    specifications: [
      { key: 'Pieces', value: '24, service for 6' },
      { key: 'Material', value: 'Glazed ceramic' },
      { key: 'Care', value: 'Dishwasher and microwave safe' },
      { key: 'Includes', value: 'Plates, bowls, mugs' },
      { key: 'Finish', value: 'Chip-resistant glaze' },
    ],
  },
  {
    name: 'LED Desk Lamp with Wireless Charger',
    brand: 'Xiaomi',
    price: 2799,
    originalPrice: null,
    stock: 110,
    sizes: [],
    colors: ['White', 'Black'],
    category: 'Home & Lifestyle',
    description:
      'A sleek LED desk lamp with stepless dimming and a built-in 10W wireless charging pad in the base. The flicker-free, eye-care light is perfect for study sessions and late-night work. Charge your phone while you work, clutter free.',
    specifications: [
      { key: 'Light', value: 'LED, stepless dimming' },
      { key: 'Charger', value: '10W wireless charging pad' },
      { key: 'Power', value: 'USB-C powered' },
      { key: 'Modes', value: '3 color temperatures' },
      { key: 'Design', value: 'Foldable arm' },
    ],
  },
];

/* [productNumber (1-based), reviewerIndex (0=Ahmed, 1=Fatima, 2=Bilal), rating, comment] */
const reviewsData = [
  [1, 0, 5, 'Excellent fabric quality — the cotton feels premium and the stitching is flawless. Fits true to size. Highly recommended.'],
  [1, 1, 4, 'Bought this for my husband and he loves it. Good quality, though the collar was a bit stiff on first wear. Delivery was quick.'],
  [1, 2, 5, 'Great value for money. Wore it to the office and got compliments. Will definitely buy more colors.'],
  [5, 0, 5, 'The embroidery is beautiful and the fabric is so comfortable. Wore it on Eid and received so many compliments.'],
  [5, 1, 4, 'Ordered for my brother — lovely kurta with neat finishing. Slightly long, but the size guide helped. Good purchase.'],
  [5, 2, 4, 'Good quality cotton, embroidery looks premium. Delivery took a day longer than expected, otherwise perfect.'],
  [7, 0, 3, 'Fabric is nice but the colors are slightly different from the pictures. Overall decent for the price.'],
  [7, 1, 5, 'Absolutely love this suit! The embroidery is gorgeous and the dupatta is so soft. Perfect for summer events.'],
  [7, 2, 4, 'Bought for my wife — she is very happy with the fit and quality. Packaging was neat too.'],
  [13, 0, 5, 'Amazing sound quality and the noise cancellation actually works. Battery easily lasts my whole work week.'],
  [13, 1, 4, 'Good earbuds for the price. Sound is clear, though the touch controls are a bit sensitive. Happy overall.'],
  [13, 2, 5, 'Best purchase this year! Pairing is instant and the bass is deep. Delivery was super fast.'],
  [14, 0, 5, 'Fantastic phone — the display is gorgeous and the camera takes stunning photos. Battery lasts two days easily.'],
  [14, 1, 4, 'Great value for the features. Camera and display are excellent; the phone is a bit heavy but you get used to it.'],
  [14, 2, 5, 'Upgraded from my old phone and the difference is night and day. Super smooth performance, highly recommended.'],
  [19, 0, 5, 'Super comfortable for my morning runs. Great grip and cushioning — no foot pain even after 10km.'],
  [19, 1, 4, 'Bought for my brother. He says they are very comfortable and true to size. A bit pricey but worth it.'],
  [19, 2, 5, 'Premium quality shoes. Lightweight, breathable, and they look great too. Best running shoes I have owned.'],
  [25, 0, 5, 'Original product with proper packaging. The lenses are crystal clear and the frame feels premium.'],
  [25, 1, 4, 'Beautiful classic design with great UV protection. Slightly loose on my face but overall very happy.'],
  [25, 2, 3, 'Good sunglasses and authentic, but delivery took longer than expected. The product itself is solid.'],
  [30, 0, 5, 'Soft, breathable cotton and the fitted sheet stays in place. Washes well without fading. Excellent quality.'],
  [30, 1, 5, 'Love the fabric — feels premium and looks elegant on the bed. The pillow covers are generously sized.'],
  [30, 2, 4, 'Good quality bedsheet set, comfortable to sleep on. Colors match the pictures. Value for money.'],
];

const daysFromNow = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

const couponsData = [
  {
    code: 'WELCOME10',
    discountType: 'percent',
    discountValue: 10,
    maxDiscount: 1000,
    minOrderAmount: 2000,
    expiresAt: daysFromNow(90),
    usageLimit: 1000,
    isActive: true,
  },
  {
    code: 'SAVE20',
    discountType: 'percent',
    discountValue: 20,
    maxDiscount: 2500,
    minOrderAmount: 5000,
    expiresAt: daysFromNow(60),
    usageLimit: 500,
    isActive: true,
  },
  {
    code: 'FREESHIP',
    discountType: 'fixed',
    discountValue: 350,
    minOrderAmount: 3000,
    expiresAt: daysFromNow(30),
    usageLimit: 200,
    isActive: true,
  },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/**
 * Build a product document from raw seed data.
 * @param {object} d  raw product entry
 * @param {number} index 1-based product index (used for picsum image seeds)
 * @param {object} catByName map of category name -> ObjectId
 */
function toProductDoc(d, index, catByName) {
  return {
    name: d.name,
    brand: d.brand,
    price: d.price,
    originalPrice: d.originalPrice || null,
    discount: d.originalPrice ? Math.round((1 - d.price / d.originalPrice) * 100) : 0,
    stock: d.stock,
    sizes: d.sizes || [],
    colors: d.colors || [],
    category: catByName[d.category],
    images: [
      `https://picsum.photos/seed/${index}-1/800/800`,
      `https://picsum.photos/seed/${index}-2/800/800`,
    ],
    description: d.description,
    specifications: d.specifications,
    featured: !!d.featured,
    bestSeller: !!d.bestSeller,
    isNew: !!d.isNew,
    rating: 0,
    numReviews: 0,
  };
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

async function main() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not set. Add it to server/.env');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB. Clearing collections...');

    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Review.deleteMany({});
    await Coupon.deleteMany({});
    await Cart.deleteMany({});
    await Wishlist.deleteMany({});
    await Order.deleteMany({});

    // Users — User.create() triggers the password-hashing pre-save hook
    const users = await User.create(usersData);
    console.log(`Created ${users.length} users.`);

    // Categories — Category.create() triggers the slug pre-save hook;
    // images are set afterwards from the model-generated slugs
    const categories = await Category.create(categoriesData);
    for (const cat of categories) {
      cat.image = `https://picsum.photos/seed/cat-${cat.slug}/800/600`;
      await cat.save();
    }
    const catByName = Object.fromEntries(categories.map((c) => [c.name, c._id]));
    console.log(`Created ${categories.length} categories.`);

    // Products — Product.create() triggers the slug pre-save hook
    const products = await Product.create(
      productsData.map((d, i) => toProductDoc(d, i + 1, catByName))
    );
    console.log(`Created ${products.length} products.`);

    // Reviews — 3 per reviewed product, one from each of the first 3 reviewers
    const reviewers = [users[2], users[3], users[4]]; // Ahmed Khan, Fatima Ali, Bilal Ahmed
    const reviewDocs = reviewsData.map(([productNo, reviewerIdx, rating, comment]) => ({
      product: products[productNo - 1]._id,
      user: reviewers[reviewerIdx]._id,
      rating,
      comment,
    }));
    await Review.create(reviewDocs);

    // Recompute rating (1-decimal average) + numReviews for reviewed products
    const reviewedProductNos = [...new Set(reviewsData.map(([n]) => n))];
    for (const n of reviewedProductNos) {
      const revs = await Review.find({ product: products[n - 1]._id });
      const avg = revs.reduce((sum, r) => sum + r.rating, 0) / revs.length;
      await Product.updateOne(
        { _id: products[n - 1]._id },
        { rating: Math.round(avg * 10) / 10, numReviews: revs.length }
      );
    }
    console.log(`Created ${reviewDocs.length} reviews.`);

    // Coupons
    const coupons = await Coupon.create(couponsData);
    console.log(`Created ${coupons.length} coupons.`);

    // Summary
    console.log('\nSeed completed successfully!');
    console.log(`  Users:      ${users.length}`);
    console.log(`  Categories: ${categories.length}`);
    console.log(`  Products:   ${products.length}`);
    console.log(`  Reviews:    ${reviewDocs.length}`);
    console.log(`  Coupons:    ${coupons.length}`);
    console.log('\nLogin credentials:');
    console.log(`  Admin -> ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
    console.log(`  Demo  -> ${DEMO_EMAIL} / ${DEMO_PASSWORD}\n`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    try {
      await mongoose.disconnect();
    } catch (_) {
      /* already disconnected */
    }
    process.exit(1);
  }
}

main();
