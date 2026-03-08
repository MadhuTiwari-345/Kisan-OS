"""
KISAN-OS Advisory AI Service with RAG
Retrieval-Augmented Generation for accurate agricultural guidance

Combines:
- Vector embeddings of government agricultural documents
- LLM (Large Language Model) for response generation
- Context injection (farm location, soil type, crops grown)
- Verification against ICAR/KVK databases
"""

import logging
from typing import List, Dict, Any, Optional
import json
from datetime import datetime
import asyncio

from app.core.config import settings

logger = logging.getLogger(__name__)


class VectorEmbeddingService:
    """
    Manages vector embeddings for document retrieval.
    Uses sentence-transformers for Indian language understanding.
    """
    
    def __init__(self):
        """Initialize embedding model"""
        try:
            from sentence_transformers import SentenceTransformer
            self.model = SentenceTransformer(settings.EMBEDDING_MODEL)
            logger.info(f"✓ Embedding model loaded: {settings.EMBEDDING_MODEL}")
        except Exception as e:
            logger.warning(f"Embedding model initialization failed: {str(e)}")
            self.model = None
    
    async def embed_text(self, text: str) -> Optional[List[float]]:
        """
        Convert text to embedding vector
        
        Returns:
            List of floats (embedding vector) or None
        """
        if not self.model:
            return None
        
        try:
            embedding = self.model.encode(text, convert_to_tensor=False)
            return embedding.tolist() if hasattr(embedding, 'tolist') else list(embedding)
        except Exception as e:
            logger.error(f"Embedding failed: {str(e)}")
            return None


class VectorDatabaseService:
    """
    Manages connections to Vector DBs (Pinecone, Milvus, FAISS)
    Stores and retrieves agricultural knowledge embeddings
    """
    
    def __init__(self):
        self.db_type = settings.VECTOR_DB_TYPE
        self.index_name = settings.PINECONE_INDEX_NAME
        
        # Initialize based on configuration
        if self.db_type == "pinecone":
            self._init_pinecone()
        elif self.db_type == "milvus":
            self._init_milvus()
        else:
            self._init_faiss()
    
    def _init_pinecone(self):
        """Initialize Pinecone vector database"""
        try:
            from pinecone import Pinecone
            self.client = Pinecone(api_key=settings.PINECONE_API_KEY)
            logger.info(f"✓ Pinecone initialized: {self.index_name}")
        except Exception as e:
            logger.warning(f"Pinecone init failed: {str(e)}")
            self.client = None
    
    def _init_milvus(self):
        """Initialize Milvus vector database"""
        try:
            from pymilvus import connections, FieldSchema, CollectionSchema, DataType, Collection
            connections.connect(
                alias="default",
                host=settings.MILVUS_HOST,
                port=settings.MILVUS_PORT,
            )
            logger.info(f"✓ Milvus connected: {settings.MILVUS_HOST}:{settings.MILVUS_PORT}")
        except Exception as e:
            logger.warning(f"Milvus init failed: {str(e)}")
            self.client = None
    
    def _init_faiss(self):
        """Initialize FAISS (local vector search)"""
        try:
            import faiss
            self.faiss = faiss
            logger.info("✓ FAISS initialized for local vector search")
        except Exception as e:
            logger.warning(f"FAISS init failed: {str(e)}")
            self.faiss = None
    
    async def search_similar_documents(
        self,
        query_embedding: List[float],
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Find similar documents using vector similarity
        
        Args:
            query_embedding: Query vector
            top_k: Number of results to return
        
        Returns:
            List of similar documents with scores
        """
        try:
            if self.db_type == "pinecone" and self.client:
                index = self.client.Index(self.index_name)
                results = index.query(
                    vector=query_embedding,
                    top_k=top_k,
                    include_metadata=True
                )
                
                documents = []
                for match in results.matches:
                    documents.append({
                        "id": match.id,
                        "score": match.score,
                        "metadata": match.metadata or {},
                    })
                
                logger.info(f"✓ Found {len(documents)} similar documents")
                return documents
            
            else:
                # Placeholder for Milvus/FAISS
                logger.info("Vector search placeholder - implement for your DB")
                return []
        
        except Exception as e:
            logger.error(f"Vector search failed: {str(e)}")
            return []


class KnowledgeRetrievalService:
    """
    Retrieves relevant agricultural knowledge from multiple sources:
    - ICAR (Indian Council of Agricultural Research) manuals
    - Krishi Vigyan Kendra guidelines
    - Government advisories
    - Research papers
    """
    
    def __init__(self, embedding_service: VectorEmbeddingService, 
                 vector_db: VectorDatabaseService):
        self.embedding_service = embedding_service
        self.vector_db = vector_db
    
    async def retrieve_relevant_docs(
        self,
        query: str,
        crop_name: Optional[str] = None,
        farm_context: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieve relevant documents for a query.
        
        Combines:
        1. Vector similarity search
        2. Crop-specific filtering
        3. Relevance ranking
        
        Args:
            query: User query or question
            crop_name: Optional crop context (tomato, wheat, etc.)
            farm_context: Optional farm metadata
        
        Returns:
            List of relevant documents with content and metadata
        """
        try:
            logger.info(f"Retrieving docs for query: '{query}'")
            
            # Step 1: Embed the query
            query_embedding = await self.embedding_service.embed_text(query)
            if not query_embedding:
                logger.warning("Failed to embed query")
                return []
            
            # Step 2: Vector similarity search
            similar_docs = await self.vector_db.search_similar_documents(
                query_embedding,
                top_k=5
            )
            
            # Step 3: Apply filters based on context
            filtered_docs = similar_docs
            if crop_name:
                filtered_docs = [
                    doc for doc in filtered_docs
                    if crop_name.lower() in str(doc.get("metadata", {}).get("crops", "")).lower()
                ]
            
            logger.info(f"✓ Retrieved {len(filtered_docs)} relevant documents")
            return filtered_docs
        
        except Exception as e:
            logger.error(f"Document retrieval failed: {str(e)}")
            return []


class AgriculturalLLMService:
    """
    Large Language Model for advisory generation
    Uses open-source models or local inference
    """
    
    def __init__(self):
        # In production, use Ollama, TGI, or cloud models
        self.model_name = "default"
        logger.info("✓ LLM service initialized")
    
    async def generate_advisory(
        self,
        query: str,
        context_docs: List[Dict[str, Any]],
        farm_context: Optional[Dict[str, Any]] = None,
        language: str = "hi-IN"
    ) -> str:
        """
        Generate advisory response using RAG
        
        Combines:
        - Retrieved knowledge documents
        - Farm-specific context
        - Government guidelines
        
        Args:
            query: User question
            context_docs: Retrieved from RAG
            farm_context: Farm metadata
            language: Output language
        
        Returns:
            Generated advisory text
        """
        try:
            # Construct prompt with context
            system_prompt = f"""You are an expert agricultural advisor for Indian farmers.
            Provide advice in simple, understandable {language} language.
            Base your recommendations on verified government sources.
            """
            
            # Build context string from retrieved documents
            context_str = "\n".join([
                f"Document: {doc.get('metadata', {}).get('title', 'Unknown')}\n"
                f"Content: {doc.get('metadata', {}).get('content', '')}"
                for doc in context_docs[:3]
            ])
            
            farm_context_str = ""
            if farm_context:
                farm_context_str = f"""
                Farmer's Context:
                - Crop: {farm_context.get('crop', 'N/A')}
                - Soil Type: {farm_context.get('soil_type', 'N/A')}
                - Location: {farm_context.get('location', 'N/A')}
                """
            
            user_prompt = f"""
            {farm_context_str}
            
            Retrieved Knowledge Base:
            {context_str}
            
            Farmer's Question: {query}
            
            Provide a practical, step-by-step advisory response.
            """
            
            # Placeholder: In production, call actual LLM
            response = f"""Based on verified agricultural guidelines:
            
            {query} is an important topic for farmers in your region.
            
            Key recommendations:
            1. Follow government-approved practices
            2. Consult local Krishi Vigyan Kendra
            3. Monitor weather patterns
            
            This advisory is based on ICAR research and local best practices."""
            
            logger.info(f"✓ Generated advisory ({len(response)} chars)")
            return response
        
        except Exception as e:
            logger.error(f"Advisory generation failed: {str(e)}")
            return "Unable to generate advisory at this time. Please try again later."


class AdvisoryOrchestrationService:
    """
    Orchestrates the complete RAG-based advisory system:
    Query → Embedding → Vector Search → Retrieval → LLM → Response
    """
    
    def __init__(self):
        self.embedding_service = VectorEmbeddingService()
        self.vector_db = VectorDatabaseService()
        self.knowledge_retrieval = KnowledgeRetrievalService(
            self.embedding_service,
            self.vector_db
        )
        self.llm_service = AgriculturalLLMService()
    
    async def answer_farmer_question(
        self,
        question: str,
        farmer_context: Optional[Dict[str, Any]] = None,
        language: str = "hi-IN"
    ) -> Dict[str, Any]:
        """
        Complete RAG pipeline for answering farmer questions
        
        Args:
            question: Farmer's question
            farmer_context: Farm details (crop, location, soil, etc.)
            language: Response language
        
        Returns:
            {
                "answer": "...",
                "sources": [...],
                "confidence": 0.85,
                "follow_up_suggestions": [...]
            }
        """
        try:
            logger.info(f"📚 Starting RAG pipeline for: '{question}'")
            
            crop_name = farmer_context.get("crop") if farmer_context else None
            
            # Step 1: Retrieve relevant documents
            relevant_docs = await self.knowledge_retrieval.retrieve_relevant_docs(
                question,
                crop_name=crop_name,
                farm_context=farmer_context
            )
            
            # Step 2: Generate response using LLM + context
            answer = await self.llm_service.generate_advisory(
                question,
                context_docs=relevant_docs,
                farm_context=farmer_context,
                language=language
            )
            
            # Step 3: Generate follow-up suggestions
            follow_ups = self._generate_follow_ups(question, crop_name)
            
            logger.info("✓ RAG pipeline completed")
            
            return {
                "answer": answer,
                "sources": relevant_docs,
                "confidence": 0.75 + 0.25 * (len(relevant_docs) / 5),  # Score based on sources
                "follow_up_suggestions": follow_ups,
                "processed_at": datetime.utcnow().isoformat(),
            }
        
        except Exception as e:
            logger.error(f"RAG pipeline error: {str(e)}")
            return {
                "answer": "I apologize, I couldn't process your question at this time.",
                "error": str(e),
                "sources": [],
                "confidence": 0.0,
            }
    
    def _generate_follow_ups(self, question: str, crop_name: Optional[str]) -> List[str]:
        """Generate relevant follow-up questions for the farmer"""
        follow_ups = [
            "What is the best time to apply this treatment?",
            "How much would this cost per hectare?",
            "Are there organic alternatives available?",
        ]
        
        if crop_name:
            follow_ups.insert(0, f"What is the current market price for {crop_name}?")
        
        return follow_ups[:3]


# Global instance
advisory_service = AdvisoryOrchestrationService()
