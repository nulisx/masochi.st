Good work so far, but this still isn’t exactly what I wanted — the site does not match the image I uploaded (izZ9i.png). I want the interface to match that image **exactly**, except in purple instead of blue, but the rest still needs to be fixed.

If you discover the default owner account isn't working, here are the credentials to verify and restore access with immediately:

* **Username:** `r` (username/email lookups are case-insensitive/doesnt matter for capitalism which means only password matters for capitalism)
* **Email:** `qq@fbi.one`
* **Password:** `ACK071675$!`

Please ensure this default owner account can log in and that login behaves correctly.

Add a MailHaven-style verification flow (see MailHavenVerify1.png / MailHavenVerify2.png). When users first load the site, show a lightweight verification flow to prevent bots and automated signups. Keep it smooth and unobtrusive but effective. Also add **profile view counters** (profile views) to user profiles.

Analyze every file in the `fixfiles` folder thoroughly and apply fixes across the site using those files as the source of truth. Concretely:

* Make the **biolink bar** in the dashboard behave exactly like the `bio*` files in `fixfiles` (e.g., `BioProfileView`, `BioSettingsView`, etc.). Implement UI and behavior to match those files precisely.
* Convert **bio-socials / biosocials** into the **Connections** system; the `BioSocialsView*` files should become the Connections feature and behave exactly as intended (editable in-place, reorderable, link validation, provider icons, etc.).
* Fix and restore the **admin panel** using `AdminView-*` and `admin-*.js`. The admin dashboard must be functional, accessible only to authorized roles, and match the design and provided files.
* Fix and restore the **mod panel** using `ModView-*` and `mod-*.js`.
* Ensure **security** implements the behavior in `SecurityView-*.js` (role checks, audit logging, security UI). Reconcile any missing bits in the UI to match those files.
* Make `DashView-*` / `dash` files in `fixfiles` drive the dashboard homepage. The homepage should behave exactly as the dash files intend (layout, widgets, ordering, responsive behavior).
* Ensure the dashboard’s **image/file component** fully reflects the logic in `FilesView-*`, `DownloadFileView-*`, `file-*.js`, and `fileview` related files: image previews, secure E2EE download flow, file metadata, download links, and file-type detection.

(Instead: the Security page should surface relevant controls and statuses. The homepage should be a concise dashboard that matches `SecurityView-*` exactly.)

Deliverables I expect after implementing the above:

2. Owner login works with the credentials above.
3. MailHaven-style verification flow added and functioning.
4. Profile view counters implemented.
5. Connections (bio-socials) are editable in place and match `BioSocialsView*` behavior.
6. Admin and mod panels fully restored and functional per `fixfiles`.
7. Security features behave like `SecurityView-*` (role checks, logging, UI).
8. Dashboard image/file components mirror `FilesView-*`, `DownloadFileView-*`, `file-*.js` logic (previews, E2EE download, file meta).
11. All discovered bugs fixed and a short summary report listing what changed and why.

If anything in `fixfiles` conflicts with the image references (izZ9i.png) or the FAQs, **prefer the image and the FAQs** unless `fixfiles` explicitly documents a required behavior that must override the UI.

---

### fixfiles — files to use as source of truth (apply changes across these files)

AdminView-C0yKbKFB.js
AdminView-Cp2iAC4B.css
BioProfileView-C39LxBAD.js
BioProfileView-CZ2kRxBf.css
BioSettingsView-4H1CKnb-.css
BioSettingsView-BVjGz2gL.js
BioSocialsView-BF4-dObm.js
BioSocialsView-oSgagLxR.css
DashView-C8yWi0pB.css
DashView-seS7qg5J.js
DownloadFileView-DdPeDNt6.js
DownloadFileView-tn0RQdqM.css
FilesView-CGFdrRAf.css
FilesView-DA6FGKzh.js
LoginSelectView-CFUMygy4.js
LoginSelectView-D9EZ9g1N.css
ModView-BzSxuPqo.css
ModView-C6qIWXEj.js
OrderView-Bc9mZ9Pi.js
ResellerView-DDi9GE4f.js
SecurityView-dAMdLOtT.js
SocialModal-BB7wGrv5.js
SocialModal-Br-7vJco.css
admin-DGMd25hE.js
core-DvUGffn3.css
dashboard-green-theme.css
file-D13pyCko.js
flag-icon-DrnuLiSg.css
flatpickr-CfPf6HP5.css
iconfont-CuKXsvG8.css
reseller-DZkdzc5d.js
style-CnoABsKM.css

---

Go through every file, test locally (build/bundle), run full QA: authentication, role-based access, E2EE upload/download, URL generation, file expiration (LitterBox), and cross-browser checks. Provide a short report of fixes and any decisions where you favored `fixfiles` vs image/FAQ directions.

Make it the best possible implementation — flawless, polished, and professional, because of this. I also want you to fix it where instead of it doing this in the image (File Hosting.png) it acts like catbox.moe and litterbox.catbox.moe where it also displays the image or file depending on what file extension it is like it displays image files, music files, stuff like that yk what i mean and fix in the Dash with the latest updates it acts like these images (DashLatestUpdates1.png, DashLatestUpdates2.png, and DashLatestUpdates3.png) as well  yk what i mean blurs the background and stuff acts entirely like it yk.

2:
good now fix everything from being mock data to actual data w the backend you said u made make everything actually work because some stuff doesnt work as you will see in the dashboard if u analyze everything fix it up entirely you never fixed the Biolinks page in the dash board with the bio files in the fixfiles folder do that now fix up the Connections to act like the bio socials files in the fixfiles folder as well along with that fix the admin panel to act exactly and entirely like the admin files in the fixfiles folder add a mod panel as well because theres mod files in the fixfiles folder as well make it based off that and for security make it based off the security files/file in the fixfiles folder and fix the images in the assets in the dash to act entirely like the files/file files in the fixfiles folder as well lets also make the design of the dashboard entirely like this css in the image as well make it entirely the same and similar css but purple instead of blue wherever u see blue in the izZ9i.png image and finally for the search bar make it actually have a search query use so i can actually search stuff not just mock data for show or anything make it all actually have a use and be useful yk what i mean fix everything entirely up i want this to be the best no mock data nothing fix everything to not be mock data and actual data and everything fix it all up entirely  and make everything entirely like the files in the fixfiles folder as i said and everything looking exactly like the image (izZ9i.png) ive uploaded as i said fix this up to be entirely the best but not only that but the greatest entirely and while ur doing that i want you to also like the icons fix up the icons change up the icons fix the css to match the izZ9i.png image entirely fix it to match the icons as well in the izZ9i.png analyze the entire izZ9i.png image to do all of this continue and everything

good now finally add icons for the icons in the litterbox and images assets in dash fix the icons in those categories i want real icons for everywhere change up the icons make the best icons find actual icons ion want colored icons i want icons like on the sidebar those typa icons but way better fix up all the icons in the dash and make it entirely better icons as well as what i said here: did you also add real icons and updated icons to the dashboard overview page along with profile, security, settings and privacy of when i said finally add icons for the icons in the litterbox and images assets in dash fix the icons in those categories i want real icons for everywhere change up the icons make the best icons find actual icons ion want colored icons i want icons like on the sidebar those typa icons but way better fix up all the icons in the dash and make it entirely better icons fix the icons entirely all of them real icons fix them its broken and wrong icons i want this to be the best icons ever i want icons without color as well as ive said above because like yes i want you to continue but i want professional monochromatic icons with consistent styling throughout all dashboard sections better icons make the api icon maybe like a key make the icons in security and everything in the security tab exactly like the izZ9i.png image entirely make security like that

good but not fully really analyze the izZ9i.png image analyze it entirely find every spec and everything every aspect of it get the right icons like w the shield icon looking like the WebRTC Leak Shield icon like in the second image and the Privacy Settings icon looking like a eye and the data protection icon looking like a shield w a lock on the bottom right of it while the login history is like a clock rotating clockwise or wtv and the account recovery is like a key yk what i mean fix it entirely up also make it where the API part in the dash has the purple border dash around it but its grey instead like in the izZ9i.png image as it is on the bottom also with the text glowi.es next to the image in the dash top left make the text size the same size as sexi.st is in the izZ9i.png image also fix the Security tab in the dash to actually look entirely like the sexi.st izZ9i.png image entirely yk what i mean make it where when you click the enable or disable button for the two-factor authentication it takes you to the Settings tab along with Password when you click the change button it takes you to the security tab as well instead of opening a Change Password box and it is only there in the Security tab to tell you a realtime sync when the password was changed make everything not mock data make everything be realtime sync entirely make this have realtime and realtime sync all that and look at the third image which is a image of the izZ9i.png image of the Terms of Service i want you to change the TOS icon in the dash to be similar to that now look at the 4th image which is also a image of the izZ9i.png image of the sidebar look at the blue dots add the same thing for me but make it purple and make a part where you can click on the Assets text to close the category or open it same for the Account and Navigation categories and when you close it the purple dot goes from purple to grey and only goes back to purple when you reopen it along with all of this look at the 5th image which is also a image of the izZ9i.png image i want you to make it where i have the ˅ thing where when you click on it the symbol then goes to ^ when its opened but when you click on it or if its closed its back to ˅ and when it opens it displays/popups whether to go to either of the tabs: Profile
Settings
or Logout of the account yk what i mean dont forget to make the Security tab look exactly and entirely like the izZ9i.png image analyze the izZ9i.png image entirely to do so

look at this image and add it to the sidebar yk like how alo.ne does it on alo.ne/dash in the second image and its to close or reopen the sidebar where it goes from < when its opened to > when its closed now look at the third image it would still show the icons of the tabs on the sidebar whether its closed or open yk what i mean to still go there and stuff but make sure that the > thing is with a border dash thats purple around it and both the < and > symbols are purple yk what i mean (look at the images SideBar1.png, SideBar2.png, SideBar3.png, SideBar4.png, and SideBar5.png i put them in order)