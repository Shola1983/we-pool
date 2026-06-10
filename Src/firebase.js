import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyA1UrFMm1D7Auv1kk634FzhlYn6PG8Hds8",
  authDomain: "shotime-football-pool.firebaseapp.com",
  databaseURL: "https://shotime-football-pool-default-rtdb.firebaseio.com",
  projectId: "shotime-football-pool",
  storageBucket: "shotime-football-pool.firebasestorage.app",
  messagingSenderId: "998690704202",
  appId: "1:998690704202:web:2b7f134b709d0e36ac0fb3",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
