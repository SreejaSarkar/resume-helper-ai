
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDcScPovGMLnpJITm9McmuiXAkXNkkMlhE",
  authDomain: "resumehelper-d7889.firebaseapp.com",
  projectId: "resumehelper-d7889",
  storageBucket: "resumehelper-d7889.firebasestorage.app",
  messagingSenderId: "61101258177",
  appId: "1:61101258177:web:8c94c6a4479fc79d5eeb40",
  measurementId: "G-V1JEM7MB87"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({
  prompt: "select_account",
});

export { auth, provider };