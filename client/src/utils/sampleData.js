export const SAMPLE_CATEGORIES = [
  {
    _id: 'cat_men',
    name: "Men's Fashion",
    image:
      'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=800&q=80',
    description:
      'Sharp, modern essentials for the contemporary man — from tailored shirts to street-ready denim.',
  },
  {
    _id: 'cat_women',
    name: "Women's Fashion",
    image:
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80',
    description:
      'Trend-forward dresses, tops, and outerwear curated for every occasion.',
  },
  {
    _id: 'cat_electronics',
    name: 'Electronics',
    image:
      'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&q=80',
    description:
      'Cutting-edge gadgets, audio gear, and smart devices from top brands.',
  },
  {
    _id: 'cat_shoes',
    name: 'Shoes',
    image:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
    description:
      'Sneakers, runners, and everyday classics built for comfort and style.',
  },
  {
    _id: 'cat_accessories',
    name: 'Accessories',
    image:
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
    description:
      'Backpacks, wallets, watches, and finishing touches that complete your look.',
  },
  {
    _id: 'cat_home',
    name: 'Home & Lifestyle',
    image:
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80',
    description:
      'Warm, inviting pieces for your home — decor, lighting, and comfort essentials.',
  },
];

export const SAMPLE_PRODUCTS = [
  {
    _id: 'prod_aurora_x5',
    name: 'Aurora X5 Wireless Headphones',
    description:
      'Immerse yourself in rich, detailed sound with the Aurora X5. Adaptive noise cancellation, 40-hour battery life, memory-foam earcups, and crystal-clear call quality make these the perfect everyday companion.',
    price: 149.99,
    originalPrice: 199.99,
    discount: 25,
    category: { _id: 'cat_electronics', name: 'Electronics' },
    brand: 'Pulse Audio',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&q=80',
    ],
    stock: 42,
    sizes: [],
    colors: ['Midnight Black', 'Arctic White', 'Ocean Blue'],
    rating: 4.8,
    numReviews: 1243,
    featured: true,
    bestSeller: true,
  },
  {
    _id: 'prod_denim_jacket',
    name: 'UrbanThread Denim Jacket',
    description:
      'A timeless trucker jacket cut from premium 14oz selvedge denim. Comfortable from day one and only gets better with wear. Chest flap pockets, metal buttons, and a classic fit that layers effortlessly.',
    price: 89.95,
    originalPrice: 119.95,
    discount: 25,
    category: { _id: 'cat_men', name: "Men's Fashion" },
    brand: 'UrbanThread',
    images: [
      'https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=800&q=80',
      'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&q=80',
    ],
    stock: 28,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Vintage Blue', 'Washed Black'],
    rating: 4.6,
    numReviews: 587,
    featured: true,
    bestSeller: false,
  },
  {
    _id: 'prod_solstice_dress',
    name: 'Solstice Summer Maxi Dress',
    description:
      'Effortless and elegant, the Solstice maxi dress drapes beautifully in breathable organic cotton. A smocked bodice, flowing skirt, and side slit make it your go-to for warm-weather occasions.',
    price: 74.0,
    originalPrice: 98.0,
    discount: 24,
    category: { _id: 'cat_women', name: "Women's Fashion" },
    brand: 'Solstice',
    images: [
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80',
      'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80',
    ],
    stock: 35,
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['Sunset Coral', 'Sage Green', 'Ivory'],
    rating: 4.7,
    numReviews: 342,
    featured: true,
    bestSeller: true,
  },
  {
    _id: 'prod_aerofit_runner',
    name: 'AeroFit Velocity Runner',
    description:
      'Engineered for speed and comfort, the Velocity Runner pairs responsive foam cushioning with a breathable knit upper. Grippy outsole, reflective details, and all-day support for your daily miles.',
    price: 129.0,
    originalPrice: 160.0,
    discount: 19,
    category: { _id: 'cat_shoes', name: 'Shoes' },
    brand: 'AeroFit',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80',
    ],
    stock: 54,
    sizes: ['7', '8', '9', '10', '11', '12'],
    colors: ['Crimson/Black', 'White/Grey', 'Navy/Lime'],
    rating: 4.9,
    numReviews: 2108,
    featured: true,
    bestSeller: true,
  },
  {
    _id: 'prod_heritage_bag',
    name: 'Heritage Leather Weekender',
    description:
      'Handcrafted from full-grain leather that develops a rich patina over time. Fits a long weekend\'s worth of essentials, with a padded laptop sleeve, brass hardware, and a detachable shoulder strap.',
    price: 189.0,
    originalPrice: 249.0,
    discount: 24,
    category: { _id: 'cat_accessories', name: 'Accessories' },
    brand: 'Heritage Leather',
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
      'https://images.unsplash.com/photo-1547949003-9792a18a2601?w=800&q=80',
    ],
    stock: 18,
    sizes: [],
    colors: ['Cognac Brown', 'Espresso', 'Black'],
    rating: 4.8,
    numReviews: 264,
    featured: false,
    bestSeller: true,
  },
  {
    _id: 'prod_lumen_lamp',
    name: 'Lumen Glow Table Lamp',
    description:
      'A sculptural ceramic lamp that casts a warm, ambient glow. Dimmable touch control, linen shade, and a compact footprint perfect for nightstands, desks, and cozy corners.',
    price: 59.99,
    originalPrice: 79.99,
    discount: 25,
    category: { _id: 'cat_home', name: 'Home & Lifestyle' },
    brand: 'Lumen Home',
    images: [
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80',
      'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&q=80',
    ],
    stock: 63,
    sizes: [],
    colors: ['Cream', 'Terracotta'],
    rating: 4.5,
    numReviews: 198,
    featured: false,
    bestSeller: false,
  },
  {
    _id: 'prod_nova_watch',
    name: 'NovaTech Chrono Smartwatch',
    description:
      'Stay connected with a vibrant AMOLED display, heart-rate and sleep tracking, 10-day battery, and 5ATM water resistance. Over 100 sport modes and built-in GPS for every adventure.',
    price: 199.0,
    originalPrice: 259.0,
    discount: 23,
    category: { _id: 'cat_electronics', name: 'Electronics' },
    brand: 'NovaTech',
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
      'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&q=80',
    ],
    stock: 31,
    sizes: [],
    colors: ['Graphite', 'Silver', 'Rose Gold'],
    rating: 4.7,
    numReviews: 932,
    featured: true,
    bestSeller: false,
  },
  {
    _id: 'prod_everlane_tee',
    name: 'Everlane Studio Essential Tee',
    description:
      'The perfect white tee does exist. Made from heavyweight 220gsm combed cotton with a tailored-not-tight fit, reinforced collar, and pre-shrunk fabric that holds its shape wash after wash.',
    price: 24.0,
    originalPrice: 32.0,
    discount: 25,
    category: { _id: 'cat_men', name: "Men's Fashion" },
    brand: 'Everlane Studio',
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80',
    ],
    stock: 120,
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: ['White', 'Black', 'Heather Grey', 'Navy'],
    rating: 4.4,
    numReviews: 1876,
    featured: false,
    bestSeller: true,
  },
];

export const SAMPLE_TESTIMONIALS = [
  {
    name: 'Sarah Mitchell',
    rating: 5,
    text: 'Ordered the Aurora X5 headphones and they arrived in two days. Sound quality is incredible and the noise cancellation works beautifully on my commute.',
    product: 'Aurora X5 Wireless Headphones',
  },
  {
    name: 'James Carter',
    rating: 5,
    text: 'The Velocity Runners are the most comfortable shoes I have ever owned. Sizing was spot on and the checkout process took less than a minute.',
    product: 'AeroFit Velocity Runner',
  },
  {
    name: 'Priya Sharma',
    rating: 4,
    text: 'Love my Solstice maxi dress — the fabric feels premium and the fit is flattering. Delivery took a day longer than expected but customer support kept me updated.',
    product: 'Solstice Summer Maxi Dress',
  },
  {
    name: 'David Okafor',
    rating: 5,
    text: 'The Heritage weekender bag exceeded my expectations. The leather smells amazing and the craftsmanship is top notch. ShopNova is now my go-to store.',
    product: 'Heritage Leather Weekender',
  },
];
