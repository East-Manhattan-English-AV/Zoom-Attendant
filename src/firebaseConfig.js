import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyCQnsUXYWJf6aZZ_l2D7cP-C67CAwK2TvU",
    authDomain: "zoom-attendant.firebaseapp.com",
    projectId: "zoom-attendant",
    storageBucket: "zoom-attendant.firebasestorage.app",
    messagingSenderId: "94905933207",
    appId: "1:94905933207:web:1ad348cf2ab55a8dbc78d2",
    measurementId: "G-7Q2SBMJ6QG"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default db;