import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

export function initUserProfile({ loginLinkId = "login", profileHeaderId = null, profileImgId = null, bioContainerId = null, defaultColor = "#FFFFFF", defaultAvatar = "Mega%20Speedruns_files/Default_Avatar.png" }) {
  const auth = getAuth();
  const db = getDatabase();
  const loginLink = document.getElementById(loginLinkId);
  const profileHeader = profileHeaderId ? document.getElementById(profileHeaderId) : null;
  const profileImg = profileImgId ? document.getElementById(profileImgId) : null;
  const bioContainer = bioContainerId ? document.getElementById(bioContainerId) : null;

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      loginLink.textContent = "Login";
      loginLink.href = "Login.html";
      if (profileHeader) profileHeader.style.color = defaultColor;
      if (profileImg) profileImg.src = defaultAvatar;
      if (bioContainer) bioContainer.innerHTML = "";
      return;
    }

    loginLink.textContent = "Profile";
    loginLink.href = `Profile.html?uid=${user.uid}`;

    try {
      const snapshot = await get(ref(db, "users/" + user.uid));
      const userData = snapshot.val();
      if (!userData) return;

      if (profileHeader) {
        const usernameColor = userData.usernameColor || defaultColor;
        profileHeader.textContent = userData.username || "User";
        profileHeader.style.color = usernameColor;
      }

      if (profileImg) {
        profileImg.src = userData.profileImageURL ? `${userData.profileImageURL}?t=${new Date().getTime()}` : defaultAvatar;
      }

      if (bioContainer) {
        bioContainer.innerHTML = userData.bio ? userData.bio.replace(/\n/g, "<br>") : "No bio set.";
      }

    } catch (err) {
      if (profileHeader) profileHeader.style.color = defaultColor;
      if (profileImg) profileImg.src = defaultAvatar;
      if (bioContainer) bioContainer.innerHTML = "";
    }
  });
}
