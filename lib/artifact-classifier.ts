// lib/artifact-classifier.ts
import { PrismaClient } from '@prisma/client';
import { createLogger } from './logger';
import path from 'path';

const logger = createLogger('ArtifactClassifier');
const prisma = new PrismaClient();

interface ClassificationResult {
  artifactId: string | null;
  confidence: number;
  possibleMatches: Array<{
    id: string;
    name: string;
    confidence: number;
  }>;
}

export class ArtifactClassifier {
  /**
   * Классифицирует файл, пытаясь определить, какому артефакту он соответствует
   */
  static async classifyFile(
    fileName: string, 
    fileContent?: string | null
  ): Promise<ClassificationResult> {
    try {
      logger.info(`Классификация файла: ${fileName}`);
      
      // Получаем каталог артефактов из базы данных
      const artifacts = await prisma.artifactCatalog.findMany();
      
      if (!artifacts || artifacts.length === 0) {
        logger.warn('Каталог артефактов пуст, классификация невозможна');
        return {
          artifactId: null,
          confidence: 0,
          possibleMatches: []
        };
      }
      
      // Извлекаем имя файла без расширения и расширение
      const fileExt = path.extname(fileName).toLowerCase();
      const fileNameWithoutExt = path.basename(fileName, fileExt);
      
      // Преобразуем имя файла в нижний регистр для сравнения
      const lowerFileName = fileNameWithoutExt.toLowerCase();
      
      // Определяем формат файла
      const format = this.getFormatFromExtension(fileExt);
      
      // Подготавливаем словарь соответствия форматов
      const formatMap: Record<string, string[]> = {
        'DOCX': ['docx', 'doc'],
        'XLSX': ['xlsx', 'xls'],
        'PDF': ['pdf'],
        'BPMN': ['bpmn', 'xml'],
        'PNG': ['png', 'jpg', 'jpeg', 'gif', 'svg']
      };
      
      // Счетчик соответствий для каждого артефакта
      const matchScores: Record<string, number> = {};
      
      // Для каждого артефакта проверяем совпадение
      for (const artifact of artifacts) {
        let score = 0;
        
        // Проверка формата файла
        if (artifact.format) {
          const formatKey = artifact.format.toUpperCase().split('/')[0];
          const extensions = formatMap[formatKey] || [];
          
          if (extensions.includes(fileExt.substring(1))) {
            score += 0.3; // 30% веса за совпадение формата
          }
        }
        
        // Проверка ключевых слов в имени файла
        if (artifact.keywords && artifact.keywords.length > 0) {
          for (const keyword of artifact.keywords) {
            if (lowerFileName.includes(keyword.toLowerCase())) {
              score += 0.2; // 20% веса за каждое найденное ключевое слово
            }
          }
        }
        
        // Проверка ID артефакта в имени файла
        if (lowerFileName.includes(artifact.id.toLowerCase())) {
          score += 0.5; // 50% веса за совпадение ID
        }
        
        // Проверка английского названия в имени файла
        if (artifact.enName && lowerFileName.includes(artifact.enName.toLowerCase())) {
          score += 0.4; // 40% веса за совпадение английского названия
        }
        
        // Проверка русского названия в имени файла
        if (artifact.ruName && lowerFileName.includes(artifact.ruName.toLowerCase())) {
          score += 0.4; // 40% веса за совпадение русского названия
        }
        
        // Если есть содержимое файла, можно проверить и его
        if (fileContent) {
          const lowerContent = fileContent.toLowerCase();
          
          // Проверка ID артефакта в содержимом
          if (lowerContent.includes(artifact.id.toLowerCase())) {
            score += 0.3; // 30% веса за совпадение ID в содержимом
          }
          
          // Проверка ключевых слов в содержимом
          if (artifact.keywords && artifact.keywords.length > 0) {
            for (const keyword of artifact.keywords) {
              if (lowerContent.includes(keyword.toLowerCase())) {
                score += 0.1; // 10% веса за каждое найденное ключевое слово в содержимом
              }
            }
          }
        }
        
        // Сохраняем итоговую оценку для артефакта
        matchScores[artifact.id] = score;
      }
      
      // Сортируем артефакты по убыванию оценки
      const sortedMatches = Object.entries(matchScores)
        .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
        .filter(([, score]) => score > 0) // Оставляем только с положительной оценкой
        .slice(0, 5); // Берем топ-5 совпадений
      
      // Если есть совпадения, возвращаем лучшее
      if (sortedMatches.length > 0) {
        const [bestMatchId, bestMatchScore] = sortedMatches[0];
        
        // Найдем информацию о лучшем совпадении
        const bestMatch = artifacts.find(a => a.id === bestMatchId);
        
        // Формируем список возможных совпадений
        const possibleMatches = sortedMatches.map(([id, score]) => {
          const artifact = artifacts.find(a => a.id === id);
          return {
            id,
            name: artifact ? artifact.ruName : id,
            confidence: score
          };
        });
        
        logger.info(`Лучшее совпадение: ${bestMatchId} с оценкой ${bestMatchScore}`);
        
        return {
          artifactId: bestMatchId,
          confidence: bestMatchScore,
          possibleMatches
        };
      }
      
      logger.info('Не найдено совпадений для файла');
      
      return {
        artifactId: null,
        confidence: 0,
        possibleMatches: []
      };
    } catch (error) {
      logger.error('Ошибка при классификации файла:', error);
      return {
        artifactId: null,
        confidence: 0,
        possibleMatches: []
      };
    }
  }
  
  /**
   * Определяет формат файла по его расширению
   */
  static getFormatFromExtension(extension: string): string {
    const ext = extension.toLowerCase().substring(1); // Убираем точку
    
    if (['doc', 'docx', 'rtf', 'odt'].includes(ext)) {
      return 'DOCX';
    } else if (['xls', 'xlsx', 'csv'].includes(ext)) {
      return 'XLSX';
    } else if (ext === 'pdf') {
      return 'PDF';
    } else if (['bpmn', 'xml'].includes(ext)) {
      return 'BPMN';
    } else if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext)) {
      return 'PNG';
    } else {
      return 'OTHER';
    }
  }
  
  /**
   * Определяет стадию артефакта по его ID
   */
  static async getStageForArtifact(artifactId: string): Promise<string | null> {
    try {
      const artifact = await prisma.artifactCatalog.findUnique({
        where: { id: artifactId }
      });
      
      if (!artifact) {
        return null;
      }
      
      // Маппинг стадий из каталога в enum стадий
      const stageMap: Record<string, string> = {
        'Initiation / Discovery': 'INITIATION_DISCOVERY',
        'Analysis & Modeling': 'ANALYSIS_MODELING',
        'Solution Design & Planning': 'SOLUTION_DESIGN_PLANNING',
        'Monitoring & Evaluation': 'MONITORING_EVALUATION'
      };
      
      return stageMap[artifact.stage] || 'ANALYSIS_MODELING'; // По умолчанию Analysis & Modeling
    } catch (error) {
      logger.error('Ошибка при определении стадии артефакта:', error);
      return null;
    }
  }
}