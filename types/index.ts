export interface ProductThumbnail {
  id: string;
  colorName: string;
  colorCode: string;
  imageUrl: string;
}

export interface Review {
  id: string;
  userName: string;
  userImage?: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Product {
  id: number;
  model: string;
  name: string;
  price: number;
  originalPrice?: number;
  description: string;
  category: 'phone' | 'accessory';
  rating: number;
  likes: number;
  ram?: string;
  storage?: string[];
  thumbnails: ProductThumbnail[];
  reviews: Review[];
  isHero: boolean;
  isPromo: boolean;
  isLatest: boolean;
  createdAt: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export const products: Product[] = [
  {
    id: 1,
    model: "A3094",
    name: "iPhone 15 Pro Max",
    price: 1199000,
    originalPrice: 1299000,
    category: "phone",
    rating: 4.8,
    likes: 124,
    storage: ["256GB", "512GB", "1TB"],
    description: "The first iPhone with an aerospace‑grade titanium design. A17 Pro chip.",
    thumbnails: [
      { id: "iph-1", colorName: "Natural Titanium", colorCode: "#f5f5f5", imageUrl: "https://www.istore.com.ng/cdn/shop/files/iPhone_15_Plus_Green_PDP_Image_Position-1__WWEN_752d2864-b00e-4f56-8732-31da1978728c_1200x.png?v=1744355361"},
      { id: "iph-2", colorName: "Blue Titanium", colorCode: "#4A5C6B", imageUrl: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=800" },
      { id: "iph-3", colorName: "White Titanium", colorCode: "#8B8B8D", imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQHamM7BeCutqqVfGduCIQGSvTjZPm5MczAUw&s"}
    ],
    reviews: [
      { id: "r1", userName: "Sarah K.", rating: 5, comment: "The titanium build is surprisingly light! Battery lasts all day even with heavy use.", date: "Feb 10, 2024" },
      { id: "r2", userName: "Michael O.", rating: 4, comment: "Incredible camera, but the price is quite a jump from last year.", date: "Feb 12, 2024" }
    ],
    isHero: true,
    isPromo: true,
    isLatest: true,
    createdAt: "2024-02-15"
  },

  {
    id: 2,
    model: "SM-G998B",
    name: "Samsung S24 Ultra",
    price: 1450000,
    category: "phone",
    rating: 4.9,
    likes: 312,
    ram: "12GB",
    storage: ["256GB", "512GB"],
    description: "The ultimate AI-powered flagship with a 200MP camera and S-Pen.",
    thumbnails: [
      { id: "sam-1", colorName: "Titanium Violet", colorCode: "#554D6E", imageUrl: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?q=80&w=800" },
      { id: "sam-2", colorName: "Titanium Gray", colorCode: "#8e8e8e", imageUrl: "https://images.unsplash.com/photo-1610792516307-ea5acd3c3800?q=80&w=800" }
    ],
    reviews: [
      { id: "r3", userName: "Emmanuel J.", rating: 5, comment: "The display is unmatched. Anti-reflective glass is a game changer.", date: "Jan 15, 2024" },
      { id: "r4", userName: "Blessing A.", rating: 5, comment: "Galaxy AI features are actually useful, especially the circle to search.", date: "Jan 20, 2024" }
    ],
    isHero: true,
    isPromo: false,
    isLatest: true,
    createdAt: "2024-02-20"
  },

  {
    id: 3,
    model: "WH-1000XM5",
    name: "Sony Headphones",
    price: 420000,
    category: "accessory",
    rating: 4.7,
    likes: 450,
    description: "Industry-leading noise cancellation and 30-hour battery life.",
    thumbnails: [
      { id: "sony-1", colorName: "Black", colorCode: "#1a1a1a", imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800" },
      { id: "sony-2", colorName: "Silver", colorCode: "#D1D1D1", imageUrl: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=800" }
    ],
    reviews: [
      { id: "r5", userName: "Tunde R.", rating: 5, comment: "Best ANC in the market. Period.", date: "Dec 05, 2023" }
    ],
    isHero: false,
    isPromo: true,
    isLatest: false,
    createdAt: "2024-01-10"
  },

  {
    id: 4,
    model: "AW-S9",
    name: "Apple Watch Series 9",
    price: 550000,
    category: "accessory",
    rating: 4.6,
    likes: 180,
    description: "Smarter, brighter, and mightier with the S9 SiP.",
    thumbnails: [
      { id: "aw-1", colorName: "Midnight", colorCode: "#171E27", imageUrl: "https://t3.ftcdn.net/jpg/05/89/20/84/360_F_589208452_jTxyYyu4DdPnVKFz2MBBb3nNs71ouyFo.jpg" },
      { id: "aw-2", colorName: "Starlight", colorCode: "#F0EAD6", imageUrl: "https://cdsassets.apple.com/live/7WUAS350/images/tech-specs/apple-watch-series-9.png" }
    ],
    reviews: [
      { id: "r6", userName: "Grace F.", rating: 4, comment: "Double tap gesture is cool, but battery still only lasts a day.", date: "Jan 02, 2024" }
    ],
    isHero: false,
    isPromo: true,
    isLatest: false,
    createdAt: "2024-01-12"
  },

  {
    id: 5,
    model: "G-PX8P",
    name: "Google Pixel 8 Pro",
    price: 980000,
    category: "phone",
    rating: 4.5,
    likes: 95,
    ram: "12GB",
    storage: ["128GB", "256GB"],
    description: "The first phone with Gemini AI built-in. 7 years of updates.",
    thumbnails: [
      { id: "pix-1", colorName: "Bay Blue", colorCode: "#A3C1DA", imageUrl: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=800" },
      { id: "pix-2", colorName: "Obsidian", colorCode: "#2D2D2D", imageUrl: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?q=80&w=800" }
    ],
    reviews: [
      { id: "r7", userName: "David L.", rating: 5, comment: "The camera captures skin tones perfectly. Software is buttery smooth.", date: "Feb 01, 2024" },
      { id: "r7", userName: "David L.", rating: 5, comment: "The camera captures skin tones perfectly. Software is buttery smooth.", date: "Feb 01, 2024" },
      { id: "r7", userName: "David L.", rating: 5, comment: "The camera captures skin tones perfectly. Software is buttery  llllllllllldeeeeeeeeessssssssd ddddferff fgddddd hle d dssssssss.", date: "Feb 01, 2024" },
      { id: "r7", userName: "David L.", rating: 5, comment: "The camera captures skin tones perfectly. Software is buttery  llllllllllldeeeeeeeeessssssssd ddddferff fgddddd hle d dssssssss.", date: "Feb 01, 2024" },
      { id: "r7", userName: "David L.", rating: 5, comment: "The camera captures skin tones perfectly. Software is buttery  llllllllllldeeeeeeeeessssssssd ddddferff fgddddd hle d dssssssss.", date: "Feb 01, 2024" },
      { id: "r7", userName: "David L.", rating: 5, comment: "The camera captures skin tones perfectly. Software is buttery smooth.", date: "Feb 01, 2024" },
    ],
    isHero: true,
    isPromo: false,
    isLatest: true,
    createdAt: "2024-02-22"
  },

  {
    id: 6,
    model: "MS-GP2",
    name: "MagSafe Battery Pack",
    price: 85000,
    category: "accessory",
    rating: 4.2,
    likes: 67,
    description: "Compact, intuitive design makes on-the-go charging easy.",
    thumbnails: [
      { id: "ms-1", colorName: "White", colorCode: "#FFFFFF", imageUrl: "https://images.unsplash.com/photo-1622445275463-afa2ab738c34?q=80&w=800" }
    ],
    reviews: [
      { id: "r8", userName: "Chioma P.", rating: 4, comment: "Convenient but charges a bit slow.", date: "Jan 10, 2024" }
    ],
    isHero: false,
    isPromo: false,
    isLatest: true,
    createdAt: "2024-02-05"
  },

  {
    id: 7,
    model: "OP-12",
    name: "OnePlus 12",
    price: 890000,
    category: "phone",
    rating: 4.4,
    likes: 140,
    ram: "16GB",
    storage: ["512GB"],
    description: "Smooth Beyond Belief. Powered by Snapdragon 8 Gen 3.",
    thumbnails: [
      { id: "op-1", colorName: "Flowy Emerald", colorCode: "#2E4D43", imageUrl: "https://m.media-amazon.com/images/G/01/DiscoTec/2024/CategoryFlips/2025/Spring_Summer/CE/EN/Summer/Browse/CE_Summer25_4594-DT-and-MOB-432x432-EN._CB550344832_UC290,290_.jpg" },
      { id: "op-2", colorName: "Silky Black", colorCode: "#1F1F1F", imageUrl: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?q=80&w=800" }
    ],
    reviews: [
      { id: "r9", userName: "Kunle S.", rating: 5, comment: "Charging speed is insane. From 0 to 100 in under 30 mins.", date: "Feb 05, 2024" }
    ],
    isHero: true,
    isPromo: false,
    isLatest: true,
    createdAt: "2024-02-18"
  },

  {
    id: 8,
    model: "DJI-M4P",
    name: "DJI Mic 2",
    price: 280000,
    category: "accessory",
    rating: 4.9,
    likes: 210,
    description: "Pocket-sized pro audio for creators and vloggers.",
    thumbnails: [
      { id: "dji-0", colorName: "Default", colorCode: "#FFFFFF", imageUrl: "https://img.freepik.com/free-vector/microphone-headphones-retro-realistic-image_1284-14415.jpg?semt=ais_user_personalization&w=740&q=80" },
      { id: "dji-1", colorName: "Shadow Black", colorCode: "#121212", imageUrl: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=800" }
    ],
    reviews: [
      { id: "r10", userName: "Victor K.", rating: 5, comment: "Crystal clear audio. The magnetic attachment is very strong.", date: "Feb 18, 2024" }
    ],
    isHero: false,
    isPromo: true,
    isLatest: true,
    createdAt: "2024-02-10"
  }
];