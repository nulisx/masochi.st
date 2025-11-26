What happened to the dashboard? It looks nothing like the image I previously uploaded (the izZ9i.png file). I need the dashboard to look **exactly** like that image (izZ9i.png)—same structure, same layout—just with a purple theme instead of blue. Please fix the entire dashboard UI so it fully matches the reference design.

Also, the search bar shortcut needs to be updated. Change it from CMD+K (⌘K) to Ctrl+K (Ctrl+K). Keep the same “⌘” icon, but the activation key must be Ctrl+K instead of Cmd+K/⌘+K.

Next, the Admin + Mod panels are missing or broken. The admin page and moderation pages must be fully restored and fully functional. In the second image I sent, there are errors related to E2EE file hosting—those need to be fixed as well. The current implementation is broken; many parts of the system aren’t even working properly. Everything became messed up, and I need the whole system fixed and restored to a high-quality working state. I wanted the old dashboard updated slightly, not replaced with something worse. Please repair everything so it functions and looks exactly how I want it.

Additionally, fix the username system so users can change their username, but only if the new username is not already taken by another user.

In the Connections page, users should be able to **edit** their existing connections instead of being forced to disconnect and reconnect with new details. Please implement full editing functionality.

Now, regarding the 4th (dash1.png) and 5th, 6th, 7th, and 8th (dash2.png, dash3.png, dash4.png, dash5.png) images:

The page that currently looks like the 5th–8th images must be redesigned to look and behave like the 4th image instead. The “dashboard homepage” should actually be the **Security** page. In the 4th image (dash1.png), the UID represents the order in which the user registered (for example, if a user was the 2nd person to ever register, their UID should be 2). Storage Used must show the **real** amount of E2EE file hosting storage used—not a placeholder number like 3176. The License Status should reflect whether an admin/mod/manager/owner marked the user as a Premium member for the file hosting service.

For Latest Updates, the system needs to automatically generate update entries showing what recently changed on the site, each with correct timestamps. This should work exactly like the examples shown in the 9th (DashLatestUpdates1.png), 10th (DashLatestUpdates2.png), and 11th (DashLatestUpdates3.png) images.

The Shoutbox from the old design has been replaced by the buttons next to the username in the header. The email icon represents email-based account update notifications. The regular notification icon represents Latest Updates and general site update notifications. Please ensure that all notification behavior is implemented correctly.

---

### **Now additional details for the E2EE File Hosting Service (based on the 12th image **(File Hosting.png)** and Catbox-style behavior):**

The current file hosting page must be rebuilt to work similarly to **Catbox.moe** but with full **E2EE encryption** (encrypted client-side before upload).

#### **General File Hosting UI (like Catbox):**

* Displays the svg logo at the top.
* Show text: **“Uploads up to 200 MB are allowed. You should read the FAQ.”**
* Include:

  * **Select or drop files**
  * **Upload via URL**
  * (Under URL input) a short playful hint like: *“Put your link in here, onii-chan~”*
  * A **Go!** upload button

#### **File Upload Behavior (E2EE):**

When uploading via file-select or drag-and-drop:

* Uploaded files generate URLs like:

  * `https://website/files/######.fileextension`
* The `######` must be a **randomized 6-character string** (letters + numbers).
* The file’s extension must remain intact.
* The dashboard must detect file type:

  * audio
  * video
  * image
  * text
  * other

When uploading via URL:

* The final link should be:

  * `https://website/files/######.fileextension`
* Again, the `######` is a **6-character randomized name**.

#### **Forbidden Filetypes:**

The following file types **must not upload**:

* `.exe`
* `.scr`
* `.cpl`
* `.doc*`
* `.jar`

The system must deny them with a proper error message.

---

### **Two Hosting Modes: E2EE File Host + E2EE LitterBox File Host**

#### **E2EE File Host (Permanent Storage Mode):**

Styled similarly to Catbox:

* Displays the svg logo at the top.
* “Uploads up to 200 MB are allowed. You should read the FAQ.”
* Select or drop files
* Upload via URL
* Links to:

  * Login | Register | FAQ | Tools | Legal/Privacy Policy | Contact | Blog | Support | Store | Status | Go Dark? (remove the stuff we already dont haveand Go Dark? is just for Going from Light Mode to Dark Mode yk what i mean)

This version stores files **permanently** unless deleted by the user or admin.

---

#### **E2EE LitterBox File Host (Temporary Mode):**

Should work like Catbox’s Litterbox with full E2EE:

* Displays the svg logo at the top
* “Temporary uploads up to 1 GB are allowed. You should read the FAQ.”
* Expire after:

  * **1 Hour**
  * **12 Hours**
  * **1 Day**
  * **3 Days**
* File name length options:

  * **6 Chars**
  * **16 Chars**
* Select or drop files
* Minimal footer:

  * FAQ | Tools | Contact | Go Dark? (remove the stuff we already dont haveand Go Dark? is just for Going from Light Mode to Dark Mode yk what i mean)
  * Optional donation message

Uploaded files must auto-expire and auto-delete based on chosen time.

---

Finally, I have also uploaded a folder named **fixfiles**. Please analyze every file entirely in that folder and use them to restore and correctly rebuild the mod panel, admin panel, security system, download/file-hosting system, file viewer, bio settings, and all other dashboard components. Go through all of the files in the fixfiles folder and apply everything necessary to rebuild this system perfectly.

I want this dashboard and service to be not just good—but the **best** and **greatest** biolink service along with the most polished, powerful, and user-friendly **E2EE file-hosting system** ever created. Fix everything fully, accurately, and professionally. Make it look exactly like the images and function flawlessly. This must be the greatest version of the dashboard ever made.

Also, you still have unfinished tasks from before due to the error (“Agent encountered an error while running”):

**In-progress tasks (0 / 12 completed):**

* Update dashboard look with purple theme: uncompleted
* Fix keyboard shortcut for search: unfinished
* Improve clicking social connections: uncompleted
* Add ability to edit connections: unfinished
* Add Discord Server connection option: uncompleted
* Create site announcements system: unfinished
* Add notification icons to header: uncompleted
* Fix and restore admin panel: unfinished
* Fix and restore mod panel: unfinished
* Fix file hosting encryption errors: unfinished
* Fix username change duplicate check: uncompleted
* Update dashboard homepage details: unfinished

I also want you to include a FAQ for both the E2EE File Host and a seperated one for the E2EE LitterBox File Host:
✅ FAQ #1 — Glowi.es (E2EE File Host):
**What is Glowi.es?**
Glowi.es is a fast, reliable, end-to-end encrypted (E2EE) file hosting service. Files are encrypted *client-side* before upload, stored securely, and delivered through simple randomized URLs. Upload files up to **200 MB** permanently (unless deleted).

---

**Who created Glowi.es?**
Glowi.es is developed and maintained by the Glowi.es team—focused on privacy, performance, and creating the cleanest E2EE hosting experience on the internet.

---

**What kinds of files are allowed?**
Most normal file types are accepted. However, the following file types are **not allowed** for security reasons:

* `.exe`
* `.scr`
* `.cpl`
* `.doc*`
* `.jar`

These will be rejected automatically.

---

**How do I upload files?**
You may upload files in one of two ways:

* **File Upload:** Select files or drag-and-drop them into the upload area.
* **URL Upload:** Paste a direct link into the “Upload via URL” field.

After uploading, you will receive a permanent, encrypted link such as:
`https://glowi.es/files/######.fileextension`
(`######` = random 6-character alphanumeric ID)

---

**What is the maximum upload size?**
Glowi.es supports uploads up to **200 MB**.

---

**How long are files stored?**
Glowi.es permanent hosting stores files indefinitely unless you delete them from your account or they violate our Terms of Service.

---

**Are files encrypted?**
Yes. All files are encrypted **before they leave your device** using E2EE.
Even we cannot view your uploaded files.

---

**Can files be removed?**
Yes. You may delete your files at any time through the dashboard. Files violating the ToS may also be removed by administrators.

---

**Can Glowi.es be used via apps or tools?**
Yes. You may integrate Glowi.es into scripts, uploaders, or third-party tools using standard POST uploads. (Public API documentation is coming soon.)

---

**Are files scanned or analyzed?**
No. Because of E2EE, Glowi.es cannot view or analyze the contents of uploaded files.

---

**Why did my file upload fail?**
Common reasons:

* File exceeded the 200 MB limit
* Forbidden file type
* Upload server timeout
* Corrupted source file
* Remote URL didn’t return a valid file

Try again or contact support.

---

**How does Glowi.es generate random file names?**
Every uploaded file is assigned a randomized **6-character alphanumeric string** to create unique links (e.g., `https://glowi.es/files/xA92fB.png`).

---

**Is there a dark mode?**
Yes—toggle **Go Dark?** at the bottom of the page to switch themes.

---

**Where can I get support?**
Use the Contact link in the footer or message support directly via the Glowi.es dashboard.

and ✅ FAQ #2 — LitterBox By Glowi.es (Temporary/LitterBox E2EE File Host):
**What is LitterBox By Glowi.es?**
LitterBox By Glowi.es is the temporary-upload version of Glowi.es. Files are uploaded with full **end-to-end encryption** and automatically deleted after their selected expiration time.

---

**How long do temporary files stay online?**
Choose from:

* **1 Hour**
* **12 Hours**
* **1 Day**
* **3 Days**

After that, files auto-expire and are permanently deleted from the system.

---

**What is the maximum upload size?**
LitterBox supports temporary uploads up to **1 GB**.

---

**How does encryption work?**
Just like Glowi.es, LitterBox encrypts files **client-side** before upload, meaning we cannot see the file contents at any stage.

---

**Can I upload any type of file?**
LitterBox follows the same restricted filelist as Glowi.es. These file types are **blocked**:

* `.exe`
* `.scr`
* `.cpl`
* `.doc*`
* `.jar`

Everything else is generally allowed.

---

**How do I upload files?**
You can upload by:

* Selecting files
* Drag-and-dropping files
* (Optional) Using the upload tool with supported clients

After uploading, you receive a temporary link such as:
`https://glowi.es/litter/######.fileextension`
(`######` = random 6 or 16 character name based on your selection)

---

**Can I choose how long the file name is?**
Yes. LitterBox lets you pick:

* **6 characters**
* **16 characters**

This affects only the URL slug length.

---

**Can I delete a file early?**
Temporary files are automatically deleted at the end of the chosen period.
Early deletion may be available from your dashboard if logged in.

---

**Is LitterBox anonymous?**
Yes. No accounts are required.
Uploads are E2EE and temporary.

---

**Why did my upload fail?**
Common issues:

* File larger than 1 GB
* Forbidden file type
* Network instability
* Source URL failing to respond
* Browser encryptor failing mid-upload

Retry or use a smaller file.

---

**Does LitterBox have a dark mode?**
Yes — click **Go Dark?** at the bottom of the page to enable dark mode.

---

**Where can I get help?**
Check the FAQ, use the Contact link, or access support via the Glowi.es dashboard.
