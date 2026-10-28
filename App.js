
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  WHATSAPP_PHONE
} from "./config.js";

const $ = (id) => document.getElementById(id);

const fallbackProducts = [
  {id:"chatgpt-plus",name:"ChatGPT Plus",category:"AI Tools",icon:"✦",price:600,duration:"1 month",featured:true,sort_order:1,description:"AI productivity subscription."},
  {id:"capcut-pro",name:"CapCut Pro",category:"Video & Media",icon:"▶",price:799,duration:"Confirm duration",featured:true,sort_order:2,description:"Video editing tools for creators."},
  {id:"canva-pro",name:"Canva Pro",category:"Design",icon:"▧",price:1000,duration:"1 year",featured:true,sort_order:3,description:"Design tools for creative projects."},
  {id:"quillbot",name:"QuillBot",category:"Writing",icon:"✎",price:350,duration:"1 month",sort_order:4,description:"Writing and paraphrasing tools."},
  {id:"grammarly",name:"Grammarly",category:"Writing",icon:"✓",price:300,duration:"1 month",sort_order:5,description:"Grammar and writing assistance."},
  {id:"stealthwriter",name:"StealthWriter",category:"Writing",icon:"✒",price:1500,duration:"1 month",sort_order:6,description:"Writing utility."},
  {id:"gemini-pro",name:"Gemini Pro",category:"AI Tools",icon:"✧",price:1500,duration:"Confirm terms",featured:true,sort_order:7,description:"AI productivity tools."},
  {id:"spotify",name:"Spotify",category:"Entertainment",icon:"♫",price:1500,duration:"3 months",sort_order:8,description:"Music subscription."},
  {id:"muse-ai",name:"Muse AI",category:"AI Tools",icon:"◈",price:599,duration:"1 month",sort_order:9,description:"AI tools."},
  {id:"netflix",name:"Netflix",category:"Entertainment",icon:"▶",price:500,duration:"1 month",sort_order:10,description:"Streaming subscription."},
  {id:"claude-pro",name:"Claude Pro",category:"AI Tools",icon:"✺",price:2500,duration:"Confirm terms",featured:true,sort_order:11,description:"AI assistant subscription."}
];

let products = [];
let cart = [];
let activeCategory = "All";
let supabase = null;

const CART_KEY = "pth_cart_v2";

function money(value) {
  return Number(value || 0).toLocaleString("en-PK", {
    maximumFractionDigits: 0
  });
}

function notify(message) {
  const toast = $("toast");
  if (!toast) {
    console.log(message);
    return;
  }

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2300);
}

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveCart() {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch (error) {
    console.warn("Could not save cart:", error);
  }
}

async function connectDatabase() {
  if (
    typeof SUPABASE_URL !== "string" ||
    !SUPABASE_URL.startsWith("https://") ||
    typeof SUPABASE_ANON_KEY !== "string" ||
    SUPABASE_ANON_KEY.length < 20
  ) {
    return false;
  }

  try {
    const { createClient } = await import(
      "https://esm.sh/@supabase/supabase-js@2"
    );

    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
}

async function loadProducts() {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;

      if (Array.isArray(data) && data.length > 0) {
        products = data.map((p, index) => ({
          ...p,
          id: String(p.id),
          name: p.name || "Product",
          category: p.category || "Other",
          price: Number(p.price || 0),
          icon: p.icon || "✦",
          sort_order: p.sort_order ?? index + 1
        }));
        return;
      }
    } catch (error) {
      console.error("Could not load live products:", error);
    }
  }

  products = fallbackProducts.map(p => ({ ...p }));
}

function renderCategories() {
  const box = $("categories");
  if (!box) return;

  box.replaceChildren();

  const names = [
    "All",
    ...new Set(products.map(p => p.category).filter(Boolean))
  ];

  names.forEach(name => {
    const button = document.createElement("button");
    button.type = "button";
    button.className =
      "category-chip" + (activeCategory === name ? " active" : "");
    button.textContent = name === "All" ? "All products" : name;

    button.addEventListener("click", () => {
      activeCategory = name;
      renderCategories();
      renderProducts();
    });

    box.appendChild(button);
  });
}

function renderProducts() {
  const grid = $("grid");
  if (!grid) return;

  grid.replaceChildren();

  const query = ($("search")?.value || "").trim().toLowerCase();
  const sort = $("sort")?.value || "featured";

  let list = products.filter(p => {
    const text = [
      p.name,
      p.category,
      p.description,
      p.duration
    ].join(" ").toLowerCase();

    return (
      (activeCategory === "All" || p.category === activeCategory) &&
      text.includes(query)
    );
  });

  if (sort === "price-low") {
    list.sort((a, b) => Number(a.price) - Number(b.price));
  } else if (sort === "price-high") {
    list.sort((a, b) => Number(b.price) - Number(a.price));
  } else if (sort === "name") {
    list.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    list.sort((a, b) =>
      Number(Boolean(b.featured)) - Number(Boolean(a.featured)) ||
      Number(a.sort_order || 999) - Number(b.sort_order || 999)
    );
  }

  list.forEach(p => {
    const card = document.createElement("article");
    card.className = "product-card";

    const top = document.createElement("div");
    top.className = "product-card-top";

    const media = document.createElement("div");
    media.className = "product-media";

    if (p.image_url) {
      const image = document.createElement("img");
      image.src = p.image_url;
      image.alt = p.name;
      image.loading = "lazy";

      image.addEventListener("error", () => {
        image.remove();
        media.textContent = p.icon || "✦";
      }, { once: true });

      media.appendChild(image);
    } else {
      media.textContent = p.icon || "✦";
    }

    top.appendChild(media);

    if (p.featured) {
      const badge = document.createElement("span");
      badge.className = "product-badge";
      badge.textContent = "FEATURED";
      top.appendChild(badge);
    }

    const title = document.createElement("h3");
    title.textContent = p.name;

    const description = document.createElement("p");
    description.className = "product-description";
    description.textContent = p.description || "";

    const duration = document.createElement("span");
    duration.className = "product-duration";
    duration.textContent = p.duration || "";

    const bottom = document.createElement("div");
    bottom.className = "product-bottom";

    const price = document.createElement("div");
    price.className = "product-price";
    price.textContent = "Rs " + money(p.price);

    const add = document.createElement("button");
    add.className = "add-btn";
    add.type = "button";
    add.textContent = "+";
    add.setAttribute("aria-label", "Add " + p.name + " to cart");
    add.addEventListener("click", () => addToCart(p.id));

    bottom.append(price, add);
    card.append(top, title, description, duration, bottom);
    grid.appendChild(card);
  });

  if ($("productCount")) {
    $("productCount").textContent = String(list.length);
  }

  if ($("noresults")) {
    $("noresults").hidden = list.length > 0;
  }
}

function addToCart(id) {
  const product = products.find(p => String(p.id) === String(id));
  if (!product) return;

  const item = cart.find(p => String(p.id) === String(id));

  if (item) {
    item.quantity = Number(item.quantity || 0) + 1;
  } else {
    cart.push({ id: product.id, quantity: 1 });
  }

  saveCart();
  renderCart();
  notify("Added to cart: " + product.name);
}

function changeQuantity(id, change) {
  const item = cart.find(p => String(p.id) === String(id));
  if (!item) return;

  item.quantity = Number(item.quantity || 0) + change;

  if (item.quantity <= 0) {
    cart = cart.filter(p => String(p.id) !== String(id));
  }

  saveCart();
  renderCart();
}

function renderCart() {
  const box = $("cartitems");
  if (!box) return;

  box.replaceChildren();

  let total = 0;
  let count = 0;

  cart = cart.filter(item =>
    products.some(p => String(p.id) === String(item.id))
  );

  cart.forEach(item => {
    const product = products.find(
      p => String(p.id) === String(item.id)
    );
    if (!product) return;

    const quantity = Number(item.quantity || 1);
    total += Number(product.price || 0) * quantity;
    count += quantity;

    const row = document.createElement("div");
    row.className = "cart-line";

    const name = document.createElement("span");
    name.className = "cart-line-name";
    name.textContent = product.name;

    const price = document.createElement("span");
    price.className = "cart-line-price";
    price.textContent = "Rs " + money(product.price * quantity);

    const controls = document.createElement("div");
    controls.className = "quantity-control";

    const minus = document.createElement("button");
    minus.type = "button";
    minus.textContent = "−";
    minus.addEventListener("click", () =>
      changeQuantity(product.id, -1)
    );

    const number = document.createElement("span");
    number.textContent = String(quantity);

    const plus = document.createElement("button");
    plus.type = "button";
    plus.textContent = "+";
    plus.addEventListener("click", () =>
      changeQuantity(product.id, 1)
    );

    controls.append(minus, number, plus);
    row.append(name, price, controls);
    box.appendChild(row);
  });

  saveCart();

  if (!cart.length) {
    const empty = document.createElement("div");
    empty.className = "cart-empty";
    empty.textContent = "Your cart is empty.";
    box.appendChild(empty);
  }

  if ($("count")) $("count").textContent = String(count);
  if ($("total")) $("total").textContent = money(total);
  if ($("checkout")) $("checkout").disabled = !cart.length;
}

function checkout() {
  if (!cart.length) {
    notify("Your cart is empty.");
    return;
  }

  const lines = cart.map(item => {
    const p = products.find(x => String(x.id) === String(item.id));
    return p
      ? p.name + " x " + item.quantity +
        " = Rs " + money(p.price * item.quantity)
      : "";
  }).filter(Boolean);

  const total = cart.reduce((sum, item) => {
    const p = products.find(x => String(x.id) === String(item.id));
    return sum + (p ? Number(p.price) * Number(item.quantity) : 0);
  }, 0);

  const phone = String(WHATSAPP_PHONE || "").replace(/\D/g, "");

  if (!phone) {
    notify("Please check the WhatsApp number in config.js.");
    return;
  }

  const message =
    "Hello Pro Tools Hub! I would like to order:\n" +
    lines.join("\n") +
    "\n\nTotal: Rs " + money(total) +
    "\nPlease confirm availability and payment instructions.";

  window.open(
    "https://wa.me/" + phone + "?text=" + encodeURIComponent(message),
    "_blank",
    "noopener,noreferrer"
  );
}

function setupEvents() {
  $("search")?.addEventListener("input", renderProducts);
  $("sort")?.addEventListener("change", renderProducts);

  $("clearFilters")?.addEventListener("click", () => {
    if ($("search")) $("search").value = "";
    activeCategory = "All";
    renderCategories();
    renderProducts();
  });

  $("checkout")?.addEventListener("click", checkout);

  $("cartNav")?.addEventListener("click", () => {
    $("cart")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });

  $("explore")?.addEventListener("click", () => {
    $("products")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });

  $("fundForm")?.addEventListener("submit", event => {
    event.preventDefault();

    const amount = Number($("amount")?.value || 0);
    const method = $("method")?.value || "";
    const phone = String(WHATSAPP_PHONE || "").replace(/\D/g, "");

    if (amount <= 0 || !Number.isFinite(amount)) {
      notify("Enter a valid payment amount.");
      return;
    }

    if (!phone) {
      notify("Please check the WhatsApp number in config.js.");
      return;
    }

    const message =
      "Hello Pro Tools Hub. Please share payment instructions.\n" +
      "Amount: Rs " + money(amount) +
      "\nMethod: " + method;

    window.open(
      "https://wa.me/" + phone + "?text=" + encodeURIComponent(message),
      "_blank",
      "noopener,noreferrer"
    );
  });
}

async function startStore() {
  cart = loadCart();
  setupEvents();

  const message = $("catalogMessage");
  if (message) message.hidden = true;

  await connectDatabase();
  await loadProducts();

  renderCategories();
  renderProducts();
  renderCart();

  if (message && !supabase) {
    message.hidden = false;
    message.textContent =
      "Showing backup products. The live catalogue connection needs checking.";
  }

  if ($("year")) {
    $("year").textContent = String(new Date().getFullYear());
  }
}

startStore().catch(error => {
  console.error("Store startup failed:", error);

  products = fallbackProducts.map(p => ({ ...p }));
  renderCategories();
  renderProducts();
  renderCart();
});
                                          
