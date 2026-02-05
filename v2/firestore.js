// firestoreConnection.js

// Initialize Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// Load Firebase config from config.js
if (!window.FIREBASE_CONFIG) {
  alert("Missing Firebase config. Please copy config.example.js to config.js and fill in your credentials.");
  throw new Error("Missing Firebase config");
}
const firebaseConfig = window.FIREBASE_CONFIG;

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// TEST CONNECTION - Check if connected to Firestore
export const testConnection = async () => {
  try {
    console.log("Testing Firestore connection...");
    // Try a single-document read to validate basic read permission.
    // Avoids collection list/read which may be blocked by security rules.
    // Use a non-reserved test document id so the SDK doesn't reject it.
    const testDocRef = doc(db, "session", "connection_check");
    await getDoc(testDocRef);
    console.log("✓ Successfully connected to Firestore!");
    return true;
  } catch (error) {
    console.error("✗ Failed to connect to Firestore:", error.message);
    if (error.code === "permission-denied") {
      console.error("🔐 Permission denied - your security rules prevented a read. Verify that your client is performing a 'get' (single doc) or a filtered query and that rules allow it.");
    }
    return false;
  }
};

// Initialize on module load (not DOMContentLoaded, as script2.js depends on this)
// console.log("Firestore client initialized");
// console.log("Firebase Config:", window.FIREBASE_CONFIG);

// // Test Firestore connection on page load
// document.addEventListener('DOMContentLoaded', async () => {
//   try {
//     const testResult = await testConnection();
//     if (testResult) { 
//       console.log("✅ Firestore is accessible");
//     } else {
//       console.warn("⚠️ Firestore connection test failed - check security rules");
//     }
//   } catch (e) {
//     console.error("❌ Firestore connection error:", e);
//   }
// });

// --- SESSION CRUD ---
window.firestoreSession = {
  // Create a session (handles both single and multi)
  async create({ title, participants, type = "single", parent = null, children = [] }) {
    if (type === "multi" && Array.isArray(children) && children.length > 0) {
      // Create parent session (title is the group name or first session name)
      const parentData = { title, participants, type, parent: null, createdAt: new Date() };
      const parentRef = await addDoc(collection(db, "session"), parentData);
      const parentId = parentRef.id;
      
      // Create child sessions, each with parent id and their own title
      const childRefs = [];
      for (const childTitle of children) {
        const childData = {
          title: childTitle,
          participants,
          type: "multi",
          parent: parentId,
          createdAt: new Date()
        };
        const childRef = await addDoc(collection(db, "session"), childData);
        childRefs.push({ id: childRef.id, ...childData });
      }
      
      // Update parent doc with child IDs so clients can read children without
      // performing a collection query (avoids relying on list() rules).
      const childIds = childRefs.map(c => c.id);
      try {
        await updateDoc(parentRef, { children: childIds });
        parentData.children = childIds;
      } catch (e) {
        // If update fails, still return created refs so client can attempt fallback
        console.warn('Could not update parent with children array:', e.message || e);
      }

      // Return parent and children
      return { parent: { id: parentId, ...parentData }, children: childRefs };
    } else {
      // Single session or no children
      const sessionData = { title, participants, type, parent, createdAt: new Date() };
      const docRef = await addDoc(collection(db, "session"), sessionData);
      return { id: docRef.id, ...sessionData };
    }
  },

  // Read session(s)
  async read({ id = null, parent = null } = {}) {
    try {
      let constraints = [];
      if (id) {
        // Read single document by ID
        const docRef = doc(db, "session", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return [{ id: docSnap.id, ...docSnap.data() }];
        } else {
          return [];
        }
      }
      if (parent !== null) {
        constraints.push(where("parent", "==", parent));
      }
      
      if (constraints.length === 0) {
        // Get all sessions
        const querySnapshot = await getDocs(collection(db, "session"));
        const data = [];
        querySnapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() });
        });
        return data;
      } else {
        // Query with constraints
        const q = query(collection(db, "session"), ...constraints);
        const querySnapshot = await getDocs(q);
        const data = [];
        querySnapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() });
        });
        return data;
      }
    } catch (error) {
      console.error("Error reading session:", error);
      throw error;
    }
  },

  // Update a session
  async update(id, updates) {
    try {
      const docRef = doc(db, "session", id);
      await updateDoc(docRef, updates);
      const docSnap = await getDoc(docRef);
      return { id: docSnap.id, ...docSnap.data() };
    } catch (error) {
      console.error("Error updating session:", error);
      throw error;
    }
  },

  // Delete a session
  async delete(id) {
    try {
      const docRef = doc(db, "session", id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error("Error deleting session:", error);
      throw error;
    }
  }
};

// --- EXPENSE CRUD ---
window.firestoreExpense = {
  // Create an expense
  async create(expense) {
    try {
      const expenseData = {
        ...expense,
        createdAt: new Date()
      };
      const docRef = await addDoc(collection(db, "expense"), expenseData);
      return { id: docRef.id, ...expenseData };
    } catch (error) {
      console.error("Error creating expense:", error);
      throw error;
    }
  },

  // Read expense(s)
  async read({ id = null, session_id = null } = {}) {
    try {
      let constraints = [];
      if (id) {
        // Read single document by ID
        const docRef = doc(db, "expense", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return [{ id: docSnap.id, ...docSnap.data() }];
        } else {
          return [];
        }
      }
      if (session_id) {
        constraints.push(where("session_id", "==", session_id));
      }
      
      if (constraints.length === 0) {
        // Get all expenses
        const querySnapshot = await getDocs(collection(db, "expense"));
        const data = [];
        querySnapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() });
        });
        return data;
      } else {
        // Query with constraints
        const q = query(collection(db, "expense"), ...constraints);
        const querySnapshot = await getDocs(q);
        const data = [];
        querySnapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() });
        });
        return data;
      }
    } catch (error) {
      console.error("Error reading expense:", error);
      throw error;
    }
  },

  // Update an expense
  async update(id, updates) {
    try {
      const docRef = doc(db, "expense", id);
      await updateDoc(docRef, updates);
      const docSnap = await getDoc(docRef);
      return { id: docSnap.id, ...docSnap.data() };
    } catch (error) {
      console.error("Error updating expense:", error);
      throw error;
    }
  },

  // Delete an expense
  async delete(id) {
    try {
      const docRef = doc(db, "expense", id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error("Error deleting expense:", error);
      throw error;
    }
  }
};