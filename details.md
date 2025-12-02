If you discover the default owner account isn't working, here are the credentials to verify and restore access with immediately:

* **Username:** `r` (username/email lookups are case-insensitive/doesnt matter for capitalism which means only password matters for capitalism)
* **Email:** `qq@fbi.one`
* **Password:** `ACK071675$!`

Please ensure this default owner account can log in and that login behaves correctly.

Analyze every file in the `fixfiles` folder thoroughly and apply fixes across the site using those files as the source of truth. Concretely:

* Fix and restore the **admin panel** using `AdminView-*` and `admin-*.js`. The admin dashboard must be functional, accessible only to authorized roles, and match the design and provided files.
* Fix and restore the **mod panel** using `ModView-*` and `mod-*.js`.
* Make `DashView-*` / `dash` files in `fixfiles` drive the dashboard homepage. The homepage should behave exactly as the dash files intend (layout, widgets, ordering, responsive behavior).

Deliverables I expect after implementing the above:

1. Owner login works with the credentials above.
2. Admin and mod panels fully restored and functional per `fixfiles`.
11. All discovered bugs fixed and a short summary report listing what changed and why.

If anything in `fixfiles` conflicts with the image references (izZ9i.png) or the FAQs, **prefer the image and the FAQs** unless `fixfiles` explicitly documents a required behavior that must override the UI.

---

### fixfiles — files to use as source of truth (apply changes across these files)

DashView-C8yWi0pB.css
DashView-seS7qg5J.js
LoginSelectView-CFUMygy4.js
LoginSelectView-D9EZ9g1N.css
OrderView-Bc9mZ9Pi.js
ResellerView-DDi9GE4f.js
SocialModal-BB7wGrv5.js
SocialModal-Br-7vJco.css
core-DvUGffn3.css
flag-icon-DrnuLiSg.css
flatpickr-CfPf6HP5.css
iconfont-CuKXsvG8.css
reseller-DZkdzc5d.js
style-CnoABsKM.css
AdminView-C0yKbKFB.js
AdminView-Cp2iAC4B.css
admin-DGMd25hE.js
ModView-BzSxuPqo.css
ModView-C6qIWXEj.js

---

Go through every file, test locally (build/bundle), run full QA: authentication, role-based access, URL generation, and cross-browser checks. Provide a short report of fixes and any decisions where you favored `fixfiles` directions.

Make it the best possible implementation — flawless, polished, and professional, because of this. I also want you to fix it where instead of it doing this in the image (File Hosting.png) it acts like catbox.moe and litterbox.catbox.moe where it also displays the image or file depending on what file extension it is like it displays image files, music files, stuff like that yk what i mean and fix in the Dash with the latest updates it acts like these images (DashLatestUpdates1.png, DashLatestUpdates2.png, and DashLatestUpdates3.png) as well  yk what i mean blurs the background and stuff acts entirely like it yk.

2:
good now fix everything from being mock data to actual data w the backend you said u made make everything actually work because some stuff doesnt work as you will see in the dashboard if u analyze everything fix it up entirely along with that fix the admin panel to act exactly and entirely like the admin files in the fixfiles folder add a mod panel as well because theres mod files in the fixfiles folder as well make it based off that make it all actually have a use and be useful yk what i mean fix everything entirely up i want this to be the best no mock data nothing fix everything to not be mock data and actual data and everything fix it all up entirely and make everything entirely like the files in the fixfiles folder as i said and everything as i said fix this up to be entirely the best but not only that but the greatest entirely and while ur doing that analyze the entire thing to do all of this continue and everything

good now go through the entire source code and everything make sure there isnt any comments remove all of the comments

good now i want you to go through the entire source code again and make sure there isnt any errors fix up all errors that you find fix everything make this the best entirely
