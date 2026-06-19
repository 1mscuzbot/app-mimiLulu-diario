import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  doc,
  setDoc,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

const EXPENSES_COLLECTION = "gastos";
const LIMITS_DOC = "limites/geral";

function getWeekRange() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = dayOfWeek === 0 ? 0 : -dayOfWeek;
  const sunday = new Date(now);
  sunday.setDate(now.getDate() + diff);
  sunday.setHours(0, 0, 0, 0);

  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);
  saturday.setHours(23, 59, 59, 999);

  return { start: sunday, end: saturday };
}

function todayString() {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

export async function addExpense(item, value, addedBy) {
  const docRef = await addDoc(collection(db, EXPENSES_COLLECTION), {
    item,
    value: parseFloat(value),
    addedBy,
    createdAt: Timestamp.now(),
    date: todayString(),
  });
  return docRef.id;
}

export function subscribeTodayExpenses(callback) {
  const today = todayString();
  const q = query(
    collection(db, EXPENSES_COLLECTION),
    where("date", "==", today),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, (snapshot) => {
    const expenses = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(expenses);
  });
}

export function subscribeWeekExpenses(callback) {
  const { start, end } = getWeekRange();
  const q = query(
    collection(db, EXPENSES_COLLECTION),
    where("createdAt", ">=", Timestamp.fromDate(start)),
    where("createdAt", "<=", Timestamp.fromDate(end)),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, (snapshot) => {
    const expenses = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(expenses);
  });
}

export async function getLimits() {
  const docSnap = await getDoc(doc(db, LIMITS_DOC));
  if (docSnap.exists()) {
    return docSnap.data();
  }
  return { diario: 100, semanal: 500 };
}

export async function setLimits(diario, semanal) {
  await setDoc(doc(db, LIMITS_DOC), { diario, semanal });
}

export function subscribeLimits(callback) {
  return onSnapshot(doc(db, LIMITS_DOC), (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data());
    } else {
      callback({ diario: 100, semanal: 500 });
    }
  });
}

export function getWeekLabel() {
  const days = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
  const { start, end } = getWeekRange();
  const s = `${start.getDate()}/${start.getMonth() + 1}`;
  const e = `${end.getDate()}/${end.getMonth() + 1}`;
  return `${s} — ${e}`;
}

export { todayString };
