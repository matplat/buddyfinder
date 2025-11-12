import type { Page } from "@playwright/test";

/**
 * Page Object dla widoku profilu użytkownika.
 * Ułatwia powtarzanie operacji takich jak dodawanie, edycja i usuwanie sportów.
 */
export class ProfileHelper {
  constructor(private readonly page: Page) {}

  /**
   * Otwiera sekcję sportów w widoku profilu.
   */
  async navigateToSportsSection() {
    await this.page.goto("/");

    const expandButton = this.page.getByRole("button", { name: /Rozwiń panel profilu/i });
    if (await expandButton.isVisible()) {
      await expandButton.click();
    }

    const accordionToggle = this.page.getByTestId("profile-view--sports-accordion-toggle");
    await accordionToggle.waitFor({ state: "visible" });

    const isExpanded = (await accordionToggle.getAttribute("aria-expanded")) === "true";
    if (!isExpanded) {
      await accordionToggle.click();
    }

    await this.page.getByTestId("profile-view--sports-section").waitFor({ state: "visible" });
  }

  /**
   * Wyświetla okno dialogowe dodawania sportu.
   */
  async openAddSportDialog() {
    await this.page.getByTestId("profile-sports--add-button").click();
    await this.page.getByTestId("sport-editor--dialog").waitFor({ state: "visible" });
  }

  /**
   * Uzupełnia formularz wyboru sportu i jego parametrów.
   */
  async fillSportForm(sportName: string, fields: Record<string, string>) {
    await this.page.getByTestId("sport-editor--sport-select").click();
    await this.page.getByRole("option", { name: sportName }).click();

    await this.updateSportParameters(fields);
  }

  /**
   * Ustawia niestandardowy zasięg dla dodawanego sportu.
   */
  async setCustomRange(kilometers: string) {
    await this.page.getByTestId("sport-editor--custom-range-input").fill(kilometers);
  }

  /**
   * Aktualizuje pola parametrów sportu (bez zmiany wyboru dyscypliny).
   */
  async updateSportParameters(fields: Record<string, string>) {
    for (const [key, value] of Object.entries(fields)) {
      await this.page.getByTestId(`sport-editor--param-${key}`).fill(value);
    }
  }

  /**
   * Zapisuje formularz i czeka na zamknięcie dialogu.
   */
  async saveSport() {
    await this.page.getByTestId("sport-editor--save-button").click();
    await this.page.getByTestId("sport-editor--dialog").waitFor({ state: "hidden" });
  }

  /**
   * Próbuje zapisać formularz, oczekując błędów walidacji (dialog pozostaje otwarty).
   */
  async submitSportFormExpectingValidationError() {
    await this.page.getByTestId("sport-editor--save-button").click();
    await this.page.getByTestId("sport-editor--dialog").waitFor({ state: "visible" });
  }

  /**
   * Otwiera dialog edycji dla wskazanego sportu.
   */
  async openEditSportDialog(sportName: string) {
    await this.getSportCard(sportName).getByTestId("edit-sport-button").click();
    await this.page.getByTestId("sport-editor--dialog").waitFor({ state: "visible" });
  }

  /**
   * Usuwa sport o podanej nazwie z profilu użytkownika.
   */
  async deleteSport(sportName: string) {
    const sportCard = this.getSportCard(sportName);

    await sportCard.getByTestId("delete-sport-button").click();
    await this.page.getByTestId("confirmation-dialog--confirm-button").click();
    await sportCard.waitFor({ state: "hidden" });
  }

  /**
   * Zwraca locator karty sportu o zadanej nazwie.
   */
  getSportCard(sportName: string) {
    return this.page
      .getByTestId("profile-sports--list")
      .getByTestId("sport-card")
      .filter({ hasText: sportName });
  }

  /**
   * Sprawdza, czy karta sportu zawiera wszystkie przekazane frazy.
   */
  async assertSportCardContains(sportName: string, texts: string[]) {
    const card = this.getSportCard(sportName);

    for (const text of texts) {
      await card.getByText(text, { exact: false }).waitFor({ state: "visible" });
    }
  }
}
