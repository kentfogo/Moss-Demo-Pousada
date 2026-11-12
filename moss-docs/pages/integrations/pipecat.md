<!-- Source: https://docs.moss.dev/docs/integrations/pipecat.md -->
# Pipecat

> Connect a Moss knowledge base to a Pipecat voice pipeline with pipecat-moss and inject retrieval results into the LLM context.

Integrate Moss Semantic Search directly into a Pipecat pipeline using the `pipecat-moss` package. This setup allows your voice AI to perform search with sub-10ms latency, ensuring your agents answer questions naturally without awkward "thinking" pauses.

> **Note:** To explore a complete example of deploying `pipecat-moss`, please visit [pipecat-moss examples](https://github.com/usemoss/pipecat-moss/tree/main/examples).

## Why Use Moss with Pipecat?

Moss retrieval operates with exceptional speed, seamlessly injecting results into the LLM context before the user completes their turn. This eliminates reliance on slow "tool calling" loops, ensuring interactions remain natural and fluid.

## Required Tools

To integrate Moss with Pipecat, you will need the following tools:

* [Moss](https://www.moss.dev/)
* [OpenAI](https://openai.com/api/)
* [Deepgram](https://deepgram.com/)
* [Cartesia](https://cartesia.ai/)

Additional references:

* [Pipecat](https://docs.pipecat.ai/getting-started/introduction)

## Integration Guide

**1. Installation**

Install the official Pipecat-Moss integration package (requires Python 3.11+).

```bash theme={null}
pip install "pipecat-moss>=0.1.0" "pipecat-ai[daily,deepgram,cartesia,openai,silero,webrtc]"
```

**2. Environment Setup**

Create a `.env` file in your project root.

```bash .env theme={null}
# Moss Credentials
MOSS_PROJECT_ID=your_project_id
MOSS_PROJECT_KEY=your_project_key
MOSS_INDEX_NAME=pipecat-knowledge

# LLM & Audio Services
OPENAI_API_KEY=sk-...
DEEPGRAM_API_KEY=...
CARTESIA_API_KEY=...
```

**3. Create Knowledge Base**

Before running the bot, ensure your Moss index is uploaded. Use the provided script:

```python theme={null}
import asyncio
import os

from dotenv import load_dotenv
from moss import DocumentInfo, MossClient
from loguru import logger

load_dotenv()

#--------------------- Upload Documents ---------------------#
async def upload_documents():
    """Upload documents to the Moss index.

    This function creates an index in the Moss service with the provided documents.
    """
    logger.debug("Starting the document upload process...")

    client = MossClient(
        project_id=os.getenv("MOSS_PROJECT_ID"), project_key=os.getenv("MOSS_PROJECT_KEY")
    )

    # Create documents
    documents = [
        DocumentInfo(
            id="doc-1",
            text="How do I track my order? You can track your order by logging into your account and visiting the 'Order History' section. Each order has a unique tracking number that you can use to monitor its delivery status.",
            metadata={"category": "orders", "topic": "tracking", "difficulty": "beginner"},
        ),
        DocumentInfo(
            id="doc-2",
            text="What is your return policy? We offer a 30-day return policy for most items. Products must be unused and in their original packaging. Return shipping costs may apply unless the item is defective.",
            metadata={"category": "returns", "topic": "policy", "difficulty": "beginner"},
        ),
        DocumentInfo(
            id="doc-3",
            text="How can I change my shipping address? You can change your shipping address before order dispatch by contacting our customer service team. Once an order is dispatched, the shipping address cannot be modified.",
            metadata={"category": "shipping", "topic": "address_change", "difficulty": "beginner"},
        ),
        DocumentInfo(
            id="doc-4",
            text="Do you ship internationally? Yes, we ship to most countries worldwide. International shipping costs and delivery times vary by location. You can check shipping rates during checkout.",
            metadata={"category": "shipping", "topic": "international", "difficulty": "beginner"},
        ),
        DocumentInfo(
            id="doc-5",
            text="How do I reset my password? Click the 'Forgot Password' link on the login page. Enter your email address, and we'll send you instructions to reset your password.",
            metadata={"category": "account", "topic": "password_reset", "difficulty": "beginner"},
        ),
        DocumentInfo(
            id="doc-6",
            text="What payment methods do you accept? We accept Visa, Mastercard, American Express, PayPal, and Apple Pay. All payments are processed securely through our encrypted payment system.",
            metadata={"category": "payment", "topic": "methods", "difficulty": "beginner"},
        ),
        DocumentInfo(
            id="doc-7",
            text="How long does shipping take? Standard domestic shipping typically takes 3-5 business days. Express shipping (1-2 business days) is available for most locations at an additional cost.",
            metadata={"category": "shipping", "topic": "delivery_time", "difficulty": "beginner"},
        ),
        DocumentInfo(
            id="doc-8",
            text="Can I cancel my order? Orders can be cancelled within 1 hour of placement. After that, if the order has not been shipped, you may contact customer service to request cancellation.",
            metadata={"category": "orders", "topic": "cancellation", "difficulty": "beginner"},
        ),
        DocumentInfo(
            id="doc-9",
            text="Do you offer gift wrapping? Yes, gift wrapping is available for most items at checkout for a small additional fee. You can also include a personalized gift message.",
            metadata={"category": "services", "topic": "gift_wrapping", "difficulty": "beginner"},
        ),
        DocumentInfo(
            id="doc-10",
            text="What is your price match policy? We match prices from authorized retailers for identical items within 14 days of purchase. Send us proof of the lower price, and we'll refund the difference.",
            metadata={"category": "pricing", "topic": "price_match", "difficulty": "intermediate"},
        ),
    ]

    # Push docs to Moss
    try:
        logger.debug("Creating the index...")
        await client.create_index(
            name=os.getenv("MOSS_INDEX_NAME"),
            docs=documents,
            model_id="moss-minilm",
        )
        logger.success("Index created successfully.")

    except Exception as e:
        logger.error("An error occurred: {0}", str(e))
        raise


# Run the async function
if __name__ == "__main__":
    asyncio.run(upload_documents())
```

Run the script using the following command:

```bash theme={null}
python create_index.py
```

**4. Build the Pipeline**

The `MossRetrievalService` integrates as a **processor** in the Pipecat pipeline. It sits between the user input and the LLM, injecting relevant context automatically.

```python theme={null}
import os
from dotenv import load_dotenv
from loguru import logger
from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.frames.frames import LLMRunFrame
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.processors.aggregators.llm_response_universal import LLMContextAggregatorPair
from pipecat.runner.run import main as runner_main
from pipecat.runner.types import RunnerArguments
from pipecat.runner.utils import create_transport
from pipecat.services.cartesia.tts import CartesiaTTSService
from pipecat.services.deepgram.stt import DeepgramSTTService
from pipecat.services.openai.llm import OpenAILLMService
from pipecat.transports.base_transport import BaseTransport, TransportParams
from pipecat.transports.daily.transport import DailyParams
from pipecat_moss import MossRetrievalService

load_dotenv(override=True)

#--------------------------- Bot Logic ---------------------------#
async def run_bot(transport: BaseTransport, runner_args: RunnerArguments):
    # init stt service 
    stt = DeepgramSTTService(api_key=os.getenv("DEEPGRAM_API_KEY"))

    # init tts service 
    tts = CartesiaTTSService(
        api_key=os.getenv("CARTESIA_API_KEY"),
        voice_id="71a7ad14-091c-4e8e-a314-022ece01c121",
    )

    # init llm service
    llm = OpenAILLMService(
        api_key=os.getenv("OPENAI_API_KEY"),
        model="gpt-4"
    )

    # init moss retrieval service 
    moss_service = MossRetrievalService(
        project_id=os.getenv("MOSS_PROJECT_ID"),
        project_key=os.getenv("MOSS_PROJECT_KEY"),
        system_prompt="Relevant passages from the Moss knowledge base:\n\n",
    )
    
    # load index from Moss(Please make sure to create the index first)
    await moss_service.load_index(os.getenv("MOSS_INDEX_NAME"))
    logger.debug("Moss retrieval service initialized")

    # prompt for LLM 
    system_content = """You are a helpful customer support voice assistant.
    Your role is to assist customers with their questions about orders, shipping,
    returns, payments, and general inquiries.

    Guidelines:
    - Be friendly, professional, and concise in your responses
    - Use any provided knowledge base context to give accurate, helpful answers
    - Always prioritize customer satisfaction and be empathetic"""

    messages = [{"role": "system", "content": system_content}]
    context = LLMContext(messages)
    context_aggregator = LLMContextAggregatorPair(context)

    # We integrate the Moss retrieval service into the pipeline here.
    pipeline = Pipeline([
        transport.input(),
        stt,
        context_aggregator.user(),
        #--------------Moss Integration----------------
        moss_service.query(os.getenv("MOSS_INDEX_NAME"), top_k=5),
        #---------------------------------------------
        llm,
        tts,
        transport.output(),
        context_aggregator.assistant(),
    ])

    # Create the pipeline task
    task = PipelineTask(
        pipeline,
        params=PipelineParams(
            enable_metrics=True,
            enable_usage_metrics=True,
            report_only_initial_ttfb=True,
        ),
    )

    @transport.event_handler("on_client_connected")
    async def on_client_connected(transport, client):
        logger.debug("Customer connected to support")
        messages.append({"role": "system", "content": "Greet the customer warmly and ask how you can help them today."})
        await task.queue_frames([LLMRunFrame()])

    @transport.event_handler("on_client_disconnected")
    async def on_client_disconnected(transport, client):
        logger.debug("Customer disconnected from support")
        await task.cancel()

    runner = PipelineRunner(handle_sigint=runner_args.handle_sigint)
    await runner.run(task)

#------------------------- Runner Entry -------------------------#
async def bot(runner_args: RunnerArguments):

    transport_params = {
        "daily": lambda: DailyParams(
            audio_in_enabled=True,
            audio_out_enabled=True,
            vad_analyzer=SileroVADAnalyzer(),
        ),
        "webrtc": lambda: TransportParams(
            audio_in_enabled=True,
            audio_out_enabled=True,
            vad_analyzer=SileroVADAnalyzer(),
        ),
    }

    transport = await create_transport(runner_args, transport_params)
    await run_bot(transport, runner_args)

#------------------------- Init Agent-------------------------#
if __name__ == "__main__":
    runner_main()
```

To use [Moss Inference](https://docs.moss.dev/docs/api-reference/v1/inference/chat-completions.md) instead of an OpenAI key, point the LLM service at the Moss gateway:

```python theme={null}
llm = OpenAILLMService(
    api_key="<project_id>:<project_key>",
    base_url="https://inference.moss.dev/v1",
    model="moss/fastlane-1",
)
```

The bot already searches your index in the pipeline (`moss_service.query`). The call names no index, so Moss Inference does not search a second time.

Run the bot using the following command:

```bash theme={null}
python bot.py
```

## Configuration

The `MossRetrievalService` allows you to tune how results are retrieved and presented to the LLM.

### Initialization

| Parameter | Type | Description |
| :- | :- | :- |
| `project_id` | `str` | **Required**. Your Moss Project ID. |
| `project_key` | `str` | **Required**. Your Moss Project Key. |
| `system_prompt` | `str` | Prefix text added to the retrieved context. Default: `"Here is additional context retrieved from database:\n\n"`. |

### Pipeline Processor

When adding `moss_service.query()` to your pipeline, you can adjust the following:

| Parameter | Type | Default | Description |
| :- | :- | :- | :- |
| `index_name` | `str` | `None` | The name of the Moss index to query. |
| `top_k` | `int` | `5` | The number of text chunks to retrieve and inject. |
| `alpha` | `float` | `0.8` | Hybrid Search Weighting. `0.0` = Keyword only. `1.0` = Semantic only (Vector). `0.8` is recommended for most voice use cases. |
