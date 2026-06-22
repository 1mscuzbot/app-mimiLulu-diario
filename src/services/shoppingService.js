import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

const COLLECTION = "compras";

export async function addItem(item, quantidade, addedBy) {
  const docRef = await addDoc(collection(db, COLLECTION), {
    item,
    quantidade: quantidade || "",
    addedBy,
    completed: false,
    completedBy: "",
    createdAt: Timestamp.now(),
    completedAt: null,
  });
  return docRef.id;
}

export async function toggleItemCompleted(itemId, completed, completedBy) {
  const data = {
    completed,
    completedAt: completed ? Timestamp.now() : null,
    completedBy: completed ? completedBy : "",
  };
  await updateDoc(doc(db, COLLECTION, itemId), data);
}

export async function updateItem(itemId, data) {
  await updateDoc(doc(db, COLLECTION, itemId), data);
}

export async function deleteItem(itemId) {
  await deleteDoc(doc(db, COLLECTION, itemId));
}

export function subscribeActiveItems(callback) {
  const q = query(
    collection(db, COLLECTION),
    where("completed", "==", false)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      items.sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() || 0;
        const tb = b.createdAt?.toMillis?.() || 0;
        return ta - tb;
      });
      callback(items);
    },
    () => callback([])
  );
}

export function subscribeCompletedItems(callback) {
  const q = query(
    collection(db, COLLECTION),
    where("completed", "==", true)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      items.sort((a, b) => {
        const ta = a.completedAt?.toMillis?.() || 0;
        const tb = b.completedAt?.toMillis?.() || 0;
        return tb - ta;
      });
      callback(items);
    },
    () => callback([])
  );
}
