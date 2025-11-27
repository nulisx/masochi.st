Good work so far, but this still isn’t exactly what I wanted — the site does not match the image I uploaded (izZ9i.png). I want the interface to match that image **exactly**, except in purple instead of blue. I like that you renamed bio-socials to **Connections** — that’s correct — but the rest still needs to be fixed.

If you discover the default owner account isn't working, here are the credentials to verify and restore access with immediately:

* **Username:** `r` (username/email lookups are case-insensitive/doesnt matter for capitalism which means only password matters for capitalism)
* **Email:** `qq@fbi.one`
* **Password:** `ACK071675$!`

Please ensure this default owner account can log in and that login behaves correctly.

Read and analyze the entire `details.md` file and any associated text. Verify everything in that file and make sure the implementation matches the specs exactly.

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

1. Dashboard matches the uploaded image (izZ9i.png) **exactly** (purple theme) — pixel spacing, fonts, and element order consistent.
2. Owner login works with the credentials above.
3. MailHaven-style verification flow added and functioning.
4. Profile view counters implemented.
5. Connections (bio-socials) are editable in place and match `BioSocialsView*` behavior.
6. Admin and mod panels fully restored and functional per `fixfiles`.
7. Security features behave like `SecurityView-*` (role checks, logging, UI).
8. Dashboard image/file components mirror `FilesView-*`, `DownloadFileView-*`, `file-*.js` logic (previews, E2EE download, file meta).
9. All E2EE file hosting behaviors match `fixfiles` + Catbox-style spec discussed: randomized slugs (`######`), forbidden filetypes (`.exe`, `.scr`, `.cpl`, `.doc*`, `.jar`), URL formats, and upload size limits.
10. Two FAQs implemented and populated from the corresponding `.md` files (E2EE File Host.md and E2EE LitterBox File Host.md).
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
good now fix everything from being mock data to actual data w the backend you said u made make everything actually work because some stuff doesnt work as you will see in the dashboard if u analyze everything fix it up entirely you never fixed the Biolinks page in the dash board with the bio files in the fixfiles folder do that now fix up the Connections to act like the bio socials files in the fixfiles folder as well along with that fix the admin panel to act exactly and entirely like the admin files in the fixfiles folder add a mod panel as well because theres mod files in the fixfiles folder as well make it based off that and for security make it based off the security files/file in the fixfiles folder and fix the images in the assets in the dash to act entirely like the files/file files in the fixfiles folder as well entirely add a Terms Of Service under Privacy in the dash as well and like in the izZ9i.png image add the API thing that says SOON near it as well bc its not done so add it with the SOON thing make the design of the dashboard entirely like this css in the image as well make it entirely the same and similar css but purple instead of blue wherever u see blue in the izZ9i.png image and finally for the search bar in this image (Search Query.png) make it actually have a search query use so i can actually search stuff not just mock data for show or anything make it all actually have a use and be useful yk what i mean fix everything entirely up i want this to be the best no mock data nothing fix everything to not be mock data and actual data and everything fix it all up entirely change the star icon next to the glowi.es text in the dash to be 2 images (randomized cycling/circling like sometimes it randomizes by detecting image files in the static/catbox folder and it randomizes through those images) yk what i mean and fix the glowi.es text to be like this glowi.es(smaller a bit with a purple color like in the izZ9i.png image) make the top right side with the profile and everything exactly like the izZ9i.png image as well expect for with the root@user(shows the users actual user).glowi.es thing because that will be for like admin@user.glowi.es or mod@user(shows the users actual user).glowi.es and for users its root@user(shows the users actual user).glowi.es make everything entirely like the files in the fixfiles folder as i said and everything looking exactly like the image (izZ9i.png) ive uploaded as i said fix this up to be entirely the best but not only that but the greatest entirely and while ur doing that i want you to also like the icons fix up the icons change up the icons fix the css to match the izZ9i.png image entirely fix it to match the icons as well in the izZ9i.png analyze the entire izZ9i.png image to do all of this continue and everything

yes i do finish this i want you to continue because i want professional monochromatic icons with consistent styling throughout all dashboard sections and i dont see icons in the dash homepage/dash overview or in the account category with profile and security neither do i see new icons in the assets category with images and litterbox and neither do i see new icons for also settings or privacy fix this all up entirely i want new icons everywhere better icons and everything entirely as of what i said: good now finally add icons for the icons in the litterbox and images assets in dash fix the icons in those categories i want real icons for everywhere change up the icons make the best icons find actual icons ion want colored icons i want icons like on the sidebar those typa icons but way better fix up all the icons in the dash and make it entirely better icons as well as what i said here: did you also add real icons and updated icons to the dashboard overview page along with profile, security, settings and privacy of when i said finally add icons for the icons in the litterbox and images assets in dash fix the icons in those categories i want real icons for everywhere change up the icons make the best icons find actual icons ion want colored icons i want icons like on the sidebar those typa icons but way better fix up all the icons in the dash and make it entirely better icons fix the icons entirely all of them real icons fix them its broken and wrong icons i want this to be the best icons ever i want icons without color as well as ive said above and i want you to fix it where it keeps redirecting me from logging in every time i login with username r and password ACK071675$! or email qq@fbi.one and password ACK071675$! it takes me to the dash then redirects me to login
