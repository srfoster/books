# Our First Model

## 🛠️Try This - Our First AI Model 

**Time estimate.** 30 minutes.

**Overview.** This exercise is designed to help you download and run your first AI model locally on your computer. We'll use the Hugging Face Transformers library to download a small text generation model and make it generate text for us.

**Justification.** This is the moment you truly make AI "yours" - when you have a model running on your own hardware, under your control. No internet required, no API keys, no rate limits. Just you and the AI, having a conversation. This is the foundation of AI independence and the first step toward understanding how these systems actually work.

**Steps.**
1. Open VS Code and create a new file called `my_first_model.py`
2. Install the required libraries by running: `pip install transformers torch`
3. Copy and run this code to load a small text generation model:
   ```python
   from transformers import pipeline
   
   # Load a small, fast text generation model
   generator = pipeline('text-generation', model='distilgpt2')
   
   # Generate some text
   prompt = "The future of AI is"
   result = generator(prompt, max_length=50, num_return_sequences=1)
   
   print(f"Prompt: {prompt}")
   print(f"Generated: {result[0]['generated_text']}")
   ```
4. Try different prompts and see how the model responds
5. Experiment with the parameters (max_length, num_return_sequences)
6. Try asking the model to complete stories, write poems, or answer questions

**Deliverable.** A screenshot of your program successfully generating text locally, along with 3 different examples of text the model generated for different prompts you tried.

**Discussion.** Congratulations! You just ran your first AI model. How does it feel to have an AI running on your computer? Notice that this model is relatively small (about 300MB) but can still generate coherent text. What are the implications of everyone having access to this technology? How might this change writing, education, and creativity? 

<!-- 

TODO:

* Activity 1: run your own small model locally
* Activity 2: evaluate two small models

* Incorporate A/v project either here or: stoicism/mindfulness, education, music,

* Incorporate summer research mini-projects: https://docs.google.com/document/d/1uZ6iBLzP9szb0kcOlVaRqFa1CPkgllNjyqZ3c2WZrmo/edit?tab=t.hzkww9hed7d8

-->