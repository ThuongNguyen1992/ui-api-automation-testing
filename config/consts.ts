import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Consts {
  readonly PROJECT_ROOT = path.resolve(__dirname, '..');
  readonly REPORTS_ROOT = path.join(this.PROJECT_ROOT, 'reports');
  readonly ALLURE_RESULTS_ROOT = path.join(this.REPORTS_ROOT, 'allure-results');
  readonly ALLURE_REPORT_ROOT = path.join(this.REPORTS_ROOT, 'allure-report');
  readonly LOGS_ROOT = path.join(this.REPORTS_ROOT, 'logs');
  // signed-in session saved by the setup project and reused by every UI test that needs a logged-in user
  readonly STORAGE_STATE = path.join(this.REPORTS_ROOT, '.auth', 'standard-user.json');
}

export default new Consts();