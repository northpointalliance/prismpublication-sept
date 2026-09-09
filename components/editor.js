const html = (d, p) => `
  <form class="cms-wrap" data-cms-editor>
    <label for="cms-domain">Domain</label>
    <input id="cms-domain" name="domain" required value="${d}">
    <label for="cms-project">Project</label>
    <input id="cms-project" name="projectId" required value="${p}">
    <label for="cms-slug">Slug</label>
    <input id="cms-slug" name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*">
    <label for="cms-title">Title</label>
    <input id="cms-title" name="title" required minlength="8">
    <label for="cms-body">Body</label>
    <textarea id="cms-body" name="body" required></textarea>
    <label for="cms-file">Image</label>
    <input id="cms-file" type="file" accept="image/*">
    <button type="submit">Save draft</button>
    <p class="cms-status" aria-live="polite"></p>
  </form>`;

class CmsEditor extends HTMLElement {
  connectedCallback() {
    this.innerHTML = html(this.getAttribute("domain") || "", this.getAttribute("project-id") || "");
    this.querySelector("form").addEventListener("submit", (e) => this.save(e));
  }
  async save(e) {
    e.preventDefault();
    const api = this.getAttribute("api") || "/cms";
    const key = this.getAttribute("cms-key") || "";
    const form = e.target;
    const status = this.querySelector(".cms-status");
    const file = form.file.files[0];
    if (file) {
      const data = new FormData();
      data.append("file", file);
      const up = await fetch(`${api}/images`, {
        method: "POST",
        headers: { "x-cms-domain": form.domain.value, authorization: `Bearer ${key}` },
        body: data,
      });
      const img = await up.json();
      if (img.url) form.body.value += `\n\n![](${img.url})\n`;
    }
    const res = await fetch(`${api}/articles/${form.slug.value}`, {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        "x-cms-domain": form.domain.value,
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ title: form.title.value, body: form.body.value, status: "draft" }),
    });
    status.textContent = res.ok ? "Saved draft." : "Save failed.";
  }
}

customElements.define("cms-editor", CmsEditor);
