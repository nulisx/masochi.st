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
good now fix everything from being mock data to actual data w the backend you said u made make everything actually work because some stuff doesnt work as you will see in the dashboard if u analyze everything fix it up entirely you never fixed the Biolinks page in the dash board with the bio files in the fixfiles folder do that now fix up the Connections to act like the bio socials files in the fixfiles folder as well along with that fix the admin panel to act exactly and entirely like the admin files in the fixfiles folder add a mod panel as well because theres mod files in the fixfiles folder as well make it based off that and for security make it based off the security files/file in the fixfiles folder and fix the images in the assets in the dash to act entirely like the files/file files in the fixfiles folder as well lets also make the design of the dashboard entirely like this css in the image as well make it entirely the same and similar css but purple instead of blue wherever u see blue in the izZ9i.png image and finally for the search bar make it actually have a search query use so i can actually search stuff not just mock data for show or anything make it all actually have a use and be useful yk what i mean fix everything entirely up i want this to be the best no mock data nothing fix everything to not be mock data and actual data and everything fix it all up entirely  and make everything entirely like the files in the fixfiles folder as i said and everything looking exactly like the image (izZ9i.png) ive uploaded as i said fix this up to be entirely the best but not only that but the greatest entirely and while ur doing that analyze the entire izZ9i.png image to do all of this continue and everything

look at this image and add it to the sidebar yk like how alo.ne does it on alo.ne/dash in the second image and its to close or reopen the sidebar where it goes from < when its opened to > when its closed now look at the third image it would still show the icons of the tabs on the sidebar whether its closed or open yk what i mean to still go there and stuff but make sure that the > thing is with a border dash thats purple around it and both the < and > symbols are purple yk what i mean (look at the images SideBar1.png, SideBar2.png, SideBar3.png, SideBar4.png, and SideBar5.png i put them in order)