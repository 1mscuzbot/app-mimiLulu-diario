import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

const EXPENSES_COLLECTION = "gastos";
const LIMITS_DOC = "limites/geral";

function toDateString(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function todayString() {
  return toDateString(new Date());
}

function yesterdayString() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toDateString(d);
}

function getWeekRange() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() - 1);
  sunday.setHours(0, 0, 0, 0);

  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);
  saturday.setHours(23, 59, 59, 999);

  return { start: sunday, end: saturday };
}

export async function addExpense(item, value, addedBy, customDate) {
  const docRef = await addDoc(collection(db, EXPENSES_COLLECTION), {
    item,
    value: parseFloat(value),
    addedBy,
    createdAt: Timestamp.now(),
    date: customDate || todayString(),
  });
  return docRef.id;
}

export async function updateExpense(expenseId, data) {
  await updateDoc(doc(db, EXPENSES_COLLECTION, expenseId), data);
}

export async function updateExpenseDate(expenseId, newDate) {
  await updateDoc(doc(db, EXPENSES_COLLECTION, expenseId), { date: newDate });
}

export async function deleteExpense(expenseId) {
  await deleteDoc(doc(db, EXPENSES_COLLECTION, expenseId));
}

function listenQuery(q, callback) {
  return onSnapshot(
    q,
    (snapshot) => {
      const expenses = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(expenses);
    },
    (error) => {
      console.error("Firestore error:", error.code, error.message);
      callback([]);
    }
  );
}

export function subscribeTodayExpenses(callback) {
  const today = todayString();
  const q = query(
    collection(db, EXPENSES_COLLECTION),
    where("date", "==", today)
  );
  return listenQuery(q, (expenses) => {
    expenses.sort((a, b) => {
      const ta = a.createdAt?.toMillis?.() || 0;
      const tb = b.createdAt?.toMillis?.() || 0;
      return ta - tb;
    });
    callback(expenses);
  });
}

export function subscribeYesterdayExpenses(callback) {
  const yesterday = yesterdayString();
  const q = query(
    collection(db, EXPENSES_COLLECTION),
    where("date", "==", yesterday)
  );
  return listenQuery(q, (expenses) => {
    expenses.sort((a, b) => {
      const ta = a.createdAt?.toMillis?.() || 0;
      const tb = b.createdAt?.toMillis?.() || 0;
      return ta - tb;
    });
    callback(expenses);
  });
}

export function subscribeWeekExpenses(callback) {
  const { start, end } = getWeekRange();
  const startStr = toDateString(start);
  const endStr = toDateString(end);

  const q = query(
    collection(db, EXPENSES_COLLECTION),
    where("date", ">=", startStr),
    where("date", "<=", endStr)
  );
  return listenQuery(q, (expenses) => {
    expenses.sort((a, b) => {
      const da = a.date || "";
      const db2 = b.date || "";
      if (da !== db2) return da.localeCompare(db2);
      const ta = a.createdAt?.toMillis?.() || 0;
      const tb = b.createdAt?.toMillis?.() || 0;
      return ta - tb;
    });
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
  return onSnapshot(
    doc(db, LIMITS_DOC),
    (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data());
      } else {
        callback({ diario: 100, semanal: 500 });
      }
    },
    () => callback({ diario: 100, semanal: 500 })
  );
}

export function getWeekLabel() {
  const { start, end } = getWeekRange();
  const s = `${start.getDate()}/${start.getMonth() + 1}`;
  const e = `${end.getDate()}/${end.getMonth() + 1}`;
  return `${s} — ${e}`;
}

export { todayString, yesterdayString };
