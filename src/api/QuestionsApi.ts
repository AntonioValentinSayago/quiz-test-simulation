import { isAxiosError } from "axios";
import api from "../config/axios";

export async function getQuestionstAll() {
  try {
    const { data } = await api("/questions");
    console.log('infor',data.dat);
    return data.data;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(
        error.response.data.error || "Error al obtener Preguntas"
      );
    }

    throw new Error("Error inesperado al obtener Preguntas");
  }
}