import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAdbbOAhpyNGLF_EcEKXnchYSUB-wFTnCk",
  authDomain: "elfarouk-store.firebaseapp.com",
  projectId: "elfarouk-store",
  storageBucket: "elfarouk-store.firebasestorage.app",
  messagingSenderId: "180294720357",
  appId: "1:180294720357:web:7e44bd24127ec13aae1f8c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Complete transcribed product list from the 3 uploaded images
const productsData = [
  // --- Image 1 ---
  { weight: 3.2, name: "ام سوزوكى ٥٠ × ٧ مم طول ١٠٠ سم", quantity: 5 },
  { weight: 2.8, name: "ورقة رقم ٢ سوزوكى ٥٠ × ٧ مم طول ١٠٠ سم", quantity: 5 },
  { weight: 2.5, name: "ورقة رقم ٣ سوزوكى ٥٠ × ٧ مم طول ٩٥٠ مم", quantity: 5 },
  { weight: 1.95, name: "ورقة رقم ٥ سوزوكى ٥٠ × ٧ مم طول ٧٥٠ مم", quantity: 5 },
  { weight: 3.4, name: "أم تروسيكل ٦٠ × ٧ مم قصيره", quantity: 20 },
  { weight: 5.1, name: "ام دبابة عادة ٦٠ × ٨ طول ١٢٠ سم", quantity: 20 },
  { weight: 5.15, name: "ام ديمكس ٦٠ × ٨ طول ١٢٠٠ مم", quantity: 20 },
  { weight: 5.1, name: "ام تويوتا ميكروباص ٩٠ * ٦٠ * ٨ طول ١٢٠ سم", quantity: 10 },
  { weight: 5.05, name: "ام g m او n k r 60 * 8 مم طول ١١٤ سم", quantity: 5 },
  { weight: 5.16, name: "ام نيسان ابو اسماعيل ٦٠ × ٨ مم طول ١٢٠ سم", quantity: 5 },
  { weight: 5.4, name: "ام تويوتا ميكروباص موديل ٨٤ * ٦٠ * ٨ طول ١٢٠سم", quantity: 4 },
  { weight: 5.35, name: "ام ديمكس ٢٠١٤ * ٦٠ * ٨ طول ١٣٠ سم", quantity: 15 },
  { weight: 5.58, name: "أم نيسان حديث ٢٠٠٨ * ٦٠ × ٨ مم طول ١٢٨ مم", quantity: 4 },
  { weight: 4.45, name: "ورقة رقم ٢ g m او n k r 60 * 8 مم طول ١١٤ سم", quantity: 5 },
  { weight: 4.55, name: "لف دبابة عادة ٦٠ × ٨ طول ١٢٠ سم", quantity: 20 },
  { weight: 4.65, name: "لف ديمكس ٦٠ × ٨ طول ١٢٠٠ مم", quantity: 20 },
  { weight: 4.58, name: "ورقة لف نيسان ابو اسماعيل ٦٠ × ٨ مم طول ١٢٠سم", quantity: 4 },
  { weight: 4.65, name: "ورقة رقم ٢ تويوتا ميكروباص ٩٠ * ٦٠ * ٨ طول ١٢٠ سم", quantity: 10 },

  // --- Image 2 ---
  { weight: 8.0, name: "ام متسوبيشى امامى ٧٠ × ١٠ مم طول ١٢٠ سم", quantity: 5 },
  { weight: 8.35, name: "ام جامبو ٣٣ امامى ٧٠ × ١٠ طول ١٣٠سم", quantity: 5 },
  { weight: 6.75, name: "ورقة رقم ٢ متسوبيشى امامى ٧٠ × ١٠ مم طول ١٢٠ سم", quantity: 5 },
  { weight: 7.35, name: "ورقة لف جامبو ٣٣ امامى ٧٠ × ١٠ طول ١٣٠سم", quantity: 5 },
  { weight: 5.75, name: "ورقة رقم ٥ ديهاتسو ٧٠ × ١٠ مم طول ١١٠٠ مم", quantity: 10 },
  { weight: 6.4, name: "ورقة رقم ٤ ديهاتسو ٧٠ × ١٠ مم طول ١٢٠٠ مم", quantity: 10 },
  { weight: 6.95, name: "ورقة رقم ٣ ديهاتسو ٧٠ × ١٠ مم طول ١٣٠٠ مم", quantity: 10 },
  { weight: 5.25, name: "ورقة رقم ٦ ديهاتسو ٧٠ × ١٠ مم طول ١٠٠٠ مم", quantity: 10 },
  { weight: 8.9, name: "ام جامبو خلفى ٧٠ * ٧١ * ١١ طول ١٢٥سم", quantity: 20 },
  { weight: 7.5, name: "ورقة رقم٢ جامبو خلفى ٧٠ * ١١ طول ١٢٥سم", quantity: 15 },
  { weight: 4.45, name: "ورقة رقم ٧ جامبو خلفى ٧٠ * ١١ طول ٨٠٠ مم", quantity: 15 },
  { weight: 6.15, name: "ورقة رقم ٤ جامبو خلفى مقرن ٧٠ * ١١ طول ١١٠٠ مم", quantity: 15 },
  { weight: 6.65, name: "ورقة رقم٣ جامبو خلفى مقرن ٧٠ * ١١ طول ١٢٠٠ مم", quantity: 15 },
  { weight: 5.0, name: "ورقة رقم٦ جامبو خلفى نقل ٧٠ * ١١ طول ٩٠٠ مم", quantity: 15 },
  { weight: 5.6, name: "ورقة رقم٥ جامبو خلفى ٧٠ * ١١ طول ١٠٠٠ مم", quantity: 15 },
  { weight: 5.9, name: "ورقة كنتر سوستة ديهاتسو ٧٠ × ٨ مم طول ٦٢٠ مم", quantity: 2 },
  { weight: 7.65, name: "ورقة كنتر ديهاتسو ٧٠ × ١٨ مم طول ٨٢٠ مم", quantity: 2 },

  // --- Image 3 ---
  { weight: 4.95, name: "لف نيسان حديث ٢٠٠٨ * ٦٠ × ٨ مم طول ١٢٨ مم", quantity: 4 },
  { weight: 3.56, name: "ورقة دبابة تزويد ٦٠ × ٨ طول ١٠٠٠ مم", quantity: 30 },
  { weight: 4.0, name: "ورقة رقم ٣ دبابة عادة ٦٠ × ٨ طول ١١٠٠ مم", quantity: 30 },
  { weight: 3.85, name: "ورقة رقم ٣ ديمكس ٦٠ × ٨ طول ١١٠٠ مم", quantity: 30 },
  { weight: 3.95, name: "ورقة رقم ٣ تويوتا ميكروباص موديل ٩٠ * ٦٠ * ٨ طول ١١٥٠ مم", quantity: 10 },
  { weight: 4.25, name: "ورقة رقم ٣ رمسيس ميكروباص ٦٠ × ٨ مم طول ١٢٠٠ مم", quantity: 30 },
  { weight: 3.5, name: "ورقة رقم ٤ دبابة عادة ٦٠ × ٨ طول ٩٥٠ مم", quantity: 30 },
  { weight: 3.65, name: "ورقة رقم ٤ ديمكس ٦٠ × ٨ طول ١٠٠٠ مم", quantity: 30 },
  { weight: 3.6, name: "ورقة رقم ٤ تويوتا ميكروباص موديل ٩٠ * ٦٠ * ٨ طول ١٠٥٠ مم", quantity: 10 },
  { weight: 5.65, name: "ام ديهاتسو ٧٠ × ٨ مم طول ١١٠ سم", quantity: 4 },
  { weight: 4.95, name: "ورقة رقم ٢ ديهاتسو ٧٠ × ٨ مم طول ١١٠سم", quantity: 4 },
  { weight: 4.65, name: "ام كنتر جامبو خلفى نقل ٩٠ * ٧ طول ١٠٠٠ مم", quantity: 15 },
  { weight: 6.65, name: "ام جامبو امامى ٩٠ * ٧ طول ١١٤ سم", quantity: 15 },
  { weight: 5.8, name: "ورقة رقم ٢ جامبو امامى ٩٠ * ٧ طول ١١٤ سم", quantity: 15 },
  { weight: 3.6, name: "ورقة رقم ٦ جامبو امامى نقل مقرن ٩٠ * ٧ طول ٨٠٠ مم", quantity: 15 },
  { weight: 3.8, name: "ورقة كنتر رقم ٤ جامبو خلفى ٩٠ * ٧ طول ٨٠٠ مم", quantity: 10 },
  { weight: 4.3, name: "ورقة كنتر رقم ٣ جامبو خلفى ٩٠ * ٧ طول ٩٠٠ مم", quantity: 10 },
  { weight: 4.7, name: "ورقة رقم ٤ جامبو امامى نقل مقرن ٩٠ * ٧ طول ١٠٠٠ مم", quantity: 15 },
  { weight: 4.8, name: "ورقة رقم ٣ جامبو امامى نقل مقرن ٩٠ * ٧ طول ١١٠٠ مم", quantity: 15 }
];

async function run() {
  try {
    console.log("Signing in...");
    await signInWithEmailAndPassword(auth, "omarabdelhamead611@gmail.com", "omar333hhh!!!");
    console.log("Signed in successfully!");

    // 1. Verify/Create Category "سوست"
    console.log("Checking for category 'سوست'...");
    const catQuery = query(collection(db, 'categories'), where('name', '==', 'سوست'));
    const catSnap = await getDocs(catQuery);
    let categoryName = 'سوست';

    if (catSnap.empty) {
      console.log("Category 'سوست' not found. Creating it...");
      await addDoc(collection(db, 'categories'), {
        name: 'سوست',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log("Category 'سوست' created!");
    } else {
      console.log("Category 'سوست' already exists.");
    }

    // 2. Add each product
    console.log(`Starting to add ${productsData.length} products...`);
    let added = 0;
    const baseSku = Date.now().toString().slice(-6);

    for (let i = 0; i < productsData.length; i++) {
      const p = productsData[i];
      
      // Calculate price: Weight * 120 EGP rounded
      const price = Math.round(p.weight * 120);
      
      // Generate a unique SKU
      const sku = `S-${baseSku}-${String(i).padStart(2, '0')}`;
      
      const productObj = {
        name: p.name,
        price: price,
        cost: 0,
        quantity: p.quantity,
        minStock: 5,
        sku: sku,
        category: categoryName,
        supplier: "",
        image: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      console.log(`Adding [${i+1}/${productsData.length}]: ${p.name} | weight: ${p.weight}kg | price: ${price} EGP | quantity: ${p.quantity}`);
      await addDoc(collection(db, 'products'), productObj);
      added++;
    }

    console.log(`Successfully imported ${added} products into Firestore!`);
    process.exit(0);
  } catch (error) {
    console.error("Fatal Error:", error);
    process.exit(1);
  }
}

run();
