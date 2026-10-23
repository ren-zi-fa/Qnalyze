import type {
  ApiCategory,
  ApiQuestion,
  Attempt,
  AuthResponse,
  CategoriesResponse,
  CategoryInput,
  ExcelImportPreview,
  ExcelImportResult,
  LoginInput,
  PublicQuestionsResponse,
  QuestionInput,
  QuestionsQuery,
  QuestionsResponse,
  RegisterInput,
  SubmitAttemptInput,
  User,
} from "./types/api";

// Tetap re-export agar `import type { ... } from "@/lib/api"` lama tidak rusak.
export type * from "./types/api";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const API_BASE_URL = "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    const headers = new Headers(init?.headers);
    if (!(init?.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: "include",
      headers,
    });
  } catch {
    throw new ApiError(0, "Tidak dapat terhubung ke server. Coba lagi.");
  }

  if (!response.ok) {
    let message = `Terjadi kesalahan (${response.status})`;

    try {
      const data = (await response.json()) as { message?: string };
      if (data?.message) message = data.message;
    } catch {
      // Respons bukan JSON — pakai pesan baku.
    }

    throw new ApiError(response.status, message);
  }

  if (response.status === 204) return undefined as T;

  return (await response.json()) as T;
}

export function login(input: LoginInput) {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function register(input: RegisterInput) {
  return request<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function logout() {
  return request<void>("/auth/logout", { method: "POST" });
}

export function getCurrentUser() {
  return request<User>("/users/me");
}

export function importQuestions(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return request<ExcelImportResult>("/questions/import", {
    method: "POST",
    body: formData,
  });
}

export function previewQuestionsImport(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return request<ExcelImportPreview>("/questions/import/preview", {
    method: "POST",
    body: formData,
  });
}

export async function getCategories(publicOnly = false) {
  const result = await request<CategoriesResponse>(
    publicOnly ? "/categories/public" : "/categories",
  );
  return result.data;
}

export function createCategory(input: CategoryInput) {
  return request<ApiCategory>("/categories", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateCategory(id: number, input: Partial<CategoryInput>) {
  return request<ApiCategory>(`/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteCategory(id: number) {
  return request<void>(`/categories/${id}`, { method: "DELETE" });
}

export async function getQuestions(params: QuestionsQuery = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value));
  }
  return request<QuestionsResponse>(`/questions?${search}`);
}

export function getQuestion(id: string | number) {
  return request<ApiQuestion>(`/questions/${id}`);
}

export function createQuestion(input: QuestionInput) {
  return request<ApiQuestion>("/questions", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateQuestion(id: string | number, input: QuestionInput) {
  return request<ApiQuestion>(`/questions/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deleteQuestion(id: string | number) {
  return request<void>(`/questions/${id}`, { method: "DELETE" });
}

export function duplicateQuestion(id: string | number) {
  return request<ApiQuestion>(`/questions/${id}/duplicate`, { method: "POST" });
}

export function getPublicQuestions(categoryId: number) {
  return request<PublicQuestionsResponse>(
    `/questions/public?categoryId=${categoryId}&limit=100`,
  );
}

export function startAttempt(categoryId: number) {
  return request<Attempt>("/attempts", {
    method: "POST",
    body: JSON.stringify({ categoryId }),
  });
}

export function getAttempt(id: number) {
  return request<Attempt>(`/attempts/${id}`);
}

/** Simpan jawaban sementara tanpa mengakhiri pengerjaan. */
export function saveAttemptAnswers(
  id: number,
  answers: SubmitAttemptInput["answers"],
) {
  return request<Attempt>(`/attempts/${id}/answers`, {
    method: "PATCH",
    body: JSON.stringify({ answers }),
  });
}

export function submitAttempt(
  id: number,
  answers: SubmitAttemptInput["answers"],
) {
  return request<Attempt>(`/attempts/${id}/answers`, {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
}
