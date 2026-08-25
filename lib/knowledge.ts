import type { BusinessProfile } from "./types";

export const defaultBusinessProfile: BusinessProfile = {
  businessName: "Bhasha Commerce & Tech",
  tagline: "Smart Multilingual E-Commerce & Tech Solutions",
  industry: "Retail & Electronics",
  currency: "BDT / USD",
  operatingHours: "9:00 AM - 10:00 PM (Daily)",
  deliveryCoverage: "All 64 districts in Bangladesh & International Shipping",
  deliveryTime: "Dhaka: 24-48 hours | Outside Dhaka: 2-4 business days | International: 7-10 days",
  deliveryFee: "Inside Dhaka: ৳70 | Outside Dhaka: ৳130 | Free delivery on orders over ৳2,500",
  returnPolicy: "7-day hassle-free return or replacement for defective or damaged items. Original packaging required.",
  paymentMethods: ["Cash on Delivery (COD)", "bKash", "Nagad", "Rocket", "Visa / MasterCard", "American Express"],
  supportPhone: "+880 1700-000000",
  supportEmail: "support@bhashabot.example.com",
  products: [
    {
      name: "Bhasha Smart Watch Pro",
      price: "৳ 3,490 ($32)",
      category: "Wearables",
      description: "AMOLED display, Bluetooth calling, heart rate & SpO2 monitoring, 7-day battery life. Available in Obsidian Black & Midnight Blue.",
    },
    {
      name: "Pulse Noise-Cancelling Earbuds",
      price: "৳ 2,190 ($20)",
      category: "Audio",
      description: "Active Noise Cancellation (ANC), 32hr playtime, IPX5 water resistance, low-latency gaming mode.",
    },
    {
      name: "Ultra-Fast 65W GaN Charger",
      price: "৳ 1,450 ($14)",
      category: "Accessories",
      description: "Dual USB-C + USB-A ports, compact travel design, charges laptops, tablets & phones at full speed.",
    },
    {
      name: "Nordic Minimalist Backpack",
      price: "৳ 1,890 ($18)",
      category: "Lifestyle",
      description: "Waterproof canvas, dedicated 15.6 inch laptop compartment, hidden anti-theft pocket.",
    },
  ],
  faqs: [
    {
      question: "How do I place an order? / কিভাবে অর্ডার করবো?",
      answer: "Provide your name, delivery address, phone number, and selected product. Our team or automated system will confirm your order instantly.",
      keywords: ["order", "kivabe", "order korbo", "buy", "place order", "korte chai"],
    },
    {
      question: "What are your delivery times? / ডেলিভারি কত দিন লাগবে?",
      answer: "Inside Dhaka takes 24 to 48 hours. Outside Dhaka takes 2 to 4 days across all 64 districts in Bangladesh.",
      keywords: ["delivery", "koto din", "shipping", "shomoy", "time", "chattogram", "sylhet", "rajshahi"],
    },
    {
      question: "Can I pay with bKash or Cash on Delivery? / বিকাশ বা ক্যাশ অন ডেলিভারি আছে?",
      answer: "Yes! We accept Cash on Delivery (COD), bKash, Nagad, Rocket, and credit/debit cards.",
      keywords: ["bkash", "nagad", "payment", "cod", "cash on delivery", "taka"],
    },
    {
      question: "What is the return & warranty policy? / রিটার্ন বা ওয়ারেন্টি পলিসি কি?",
      answer: "We offer a 7-day return/exchange guarantee for any manufacturing defects or damages with original packaging.",
      keywords: ["return", "refund", "ferot", "warranty", "exchange", "kharap", "problem", "dam"],
    },
  ],
};

let currentProfile: BusinessProfile = { ...defaultBusinessProfile };

export function getBusinessProfile(): BusinessProfile {
  return currentProfile;
}

export function updateBusinessProfile(profile: Partial<BusinessProfile>): BusinessProfile {
  currentProfile = {
    ...currentProfile,
    ...profile,
  };
  return currentProfile;
}

export function generateKnowledgeContext(profile: BusinessProfile = currentProfile): string {
  const productsList = profile.products
    .map((p) => `- ${p.name} (${p.category}): ${p.price} | ${p.description}`)
    .join("\n");

  const faqsList = profile.faqs
    .map((f) => `Q: ${f.question}\nA: ${f.answer}`)
    .join("\n\n");

  return `
BUSINESS PROFILE & KNOWLEDGE BASE:
Business Name: ${profile.businessName} (${profile.tagline})
Industry: ${profile.industry}
Operating Hours: ${profile.operatingHours}
Delivery Coverage: ${profile.deliveryCoverage}
Delivery Timeline: ${profile.deliveryTime}
Delivery Fees: ${profile.deliveryFee}
Payment Options: ${profile.paymentMethods.join(", ")}
Return/Refund Policy: ${profile.returnPolicy}
Support Contact: Phone: ${profile.supportPhone} | Email: ${profile.supportEmail}

AVAILABLE PRODUCTS & PRICING:
${productsList}

FREQUENTLY ASKED QUESTIONS & POLICIES:
${faqsList}
`;
}
