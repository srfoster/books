# Making the Sausage 

<!-- 

* Reasons why edu needs to be (or will be) different now.
  - AI:
    * All teachers can be coders now     
      - Writing (books, prompt engineering, etc.) == software engineering 
        * Non-linear processes / deferred decisions / etc.
        * Agile processes
        * Working in teams
    * We have access to truly "declarative" writing.  Executable documents.
    * Students can be self teachers
    * Bureaucratic systems... Unclear.  More power?  Less?  (Time to fight?)
    * Subject "silos" can/will be torn down.  New ones built?
    * Economically.  How much of the work can you imagine being done by AI? 
  - Politics:
    * Linguisitic Civil War

[Faith Systems]: 
  * Does AI create new possibilities?  e.g. Singularity == Messiah
    - Harari's "techno religion" concept

-->

In this chapter, we'll define "education" and "education systems" by way of a few key stories.

To start things off, I spent the summer of 2025, the same summer I got married, revising a "foundations in computing" course called CIS110 -- mandatory for students in various majors and taken by hundreds of students at Olympic College every year.  I had taught the course since 2022, both online and in person, but 2025 was different.

Because... y'know... AI.  

The previous two summers, I had made AI-inspired alterations to the course, but the rapid increase in AI coding capabilities throughout 2024 and 2025 had necessitated a much deeper redesign.  I began as I always do, with a pre-existing list of "learning goals."   

> ### Computer Fundamentals
> - Explain the IPOS model of activities characteristics of computers
> - Describe the stored program concept and why it distinguishes computers from other simpler devices
> - Explain how a processor works
> - Explain the difference between RAM and ROM and why most computers have both
<details>
<summary>
(Click to read more)
</summary>

> - Discuss the relative strengths and weaknesses of magnetic, optical, and solid-state storage technology
> - Explain what I/O devices are and why they are important to computing
> - Explain what a device driver is
> - Analyze how the components of a computer system work together to execute a simple program
> - Compare and contrast different computer architectures (desktop, mobile, embedded systems)
> - Evaluate the trade-offs between performance, cost, and energy efficiency in computer design
> - Trace the flow of data through a computer system from input to output
> 
> ### Web Technologies
> - Explain how the Web works
> - Discuss the integration of three technologies that are foundational for the Web
> - Explain what the four parts of a URL are
> - Explain what a hyperlink is
> - Explain the role of a Web browser with respect to caching, history, and privacy
> - Explain what HTTP and HTTPS are
> - Explain what a Web cookie is
> - Explain what HTML is
> - Identify 5 common HTML tags and explain what they do
> - Explain what CSS is
> - Explain the role of JavaScript in a Web page
> - Design a simple webpage that demonstrates understanding of HTML structure and CSS styling
> - Analyze the security implications of different web technologies (cookies, JavaScript, HTTPS)
> - Evaluate the accessibility and usability of web interfaces
> - Explain how cloud computing relates to web technologies and modern applications
> 
> ### Social Media and Digital Communication
> - Explain what social media is
> - List three elements of a social media profile
> - Explain how 6 degrees of separation applies to social networking
> - List the six rights that are exclusively exercised by copyright holders
> - List the four factors that characterize fair use
> - Discuss why blogs were considered a disruptive technology
> - Explain how Wikipedia articles are written and edited
> - Discuss the pros and cons of Webmail and local mail
> - List the elements that constitute an online identity
> - List four techniques for dealing with cyberbullies
> - Analyze the ethical implications of data collection by social media platforms
> - Evaluate the credibility and reliability of online information sources
> - Design a digital citizenship plan that balances online engagement with privacy protection
> - Compare traditional media distribution models with modern digital platforms
> - Assess the impact of algorithmic content curation on information consumption
> 
> ### Software and File Management
> - Explain the difference between system software and application software
> - Discuss the purpose of software licensing and identify common types
> - Explain the role of the operating system
> - Explain the difference between multitasking, multiprocessing, and multithreading
> - Explain the difference between local apps and Web based apps
> - Explain the role of the basic office suite applications and their relation to each other
> - Explain the role of file management
> - Discuss file naming conventions and the role of the file extension
> - Explain the difference between an absolute path and a relative path
> - Explain the difference between the logical and physical storage models for a file
> - Design an efficient file organization system for a specific use case (academic, professional, creative)
> - Troubleshoot common software installation and configuration problems
> - Compare different operating systems and their strengths for various computing tasks
> - Evaluate software alternatives based on functionality, cost, and licensing requirements
> - Explain the software development lifecycle and how it impacts end users
> 
> ### Cybersecurity
> - Explain what encryption is
> - Explain what two-factor authentication is
> - Discuss issues with creating a strong password
> - Explain what malware is
> - Explain what a rootkit is
> - Identify common malware exploits
> - Describe how an online intrusion takes place
> - Explain what a zero-day exploit is
> - Explain the role of a firewall
> - Explain what spoofing is
> - Explain what social engineering is
> - Develop a comprehensive personal cybersecurity strategy including risk assessment
> - Analyze real-world security breaches and identify prevention strategies
> - Evaluate the security posture of common online services and applications
> - Design secure communication protocols for sensitive information sharing
> - Assess the balance between security measures and usability in system design
> 
> ### Databases
> - Define basic database terminology, such as fields, records, rows, columns, and tables
> - Explain what a relational database is
> - Explain the process of normalization
> - Explain what SQL is and identify common SQL commands and give a concrete example
> - Explain what big data is
> - Explain what NoSQL is
> - Design a simple database schema for a real-world scenario
> - Write basic SQL queries to retrieve and manipulate data
> - Analyze the trade-offs between different database types for specific applications
> - Evaluate data privacy and ethical considerations in database design
> - Explain how databases integrate with web applications and business systems

</details>

I mentioned earlier that these were pre-existing goals, a list of what the student is expected to know after finishing the course.  It's a master document that has been designed, refined, and transformed for decades by my colleagues and our predecessors.  Some of these goals have been attached to CIS110 for decades.  Others are much newer.

Like the Ship of Theseus, a list of learning goals like the one above has its own identity that persists even when all of its parts have been replaced.  This makes it an illustrative microcosm for education itself, whose fundamental character (I will argue) arises more from the bureaucratic processes that, in practice, govern it than from the lofty educational ideals that, in theory, guide it.

<img src="/textbooks/education_systems/chapters/01-defining-education/ship_of_theseus_1.png" alt="Ship of Theseus made of paper and bureaucratic materials" style="max-width: 200px; width: 100%; height: auto; display: block; margin: 20px auto;"/>

Because, however, lofty ideals tend to dominate political discourse around education and because the bureaucratic guts of education systems are intentionally hidden from students, people are sometimes surprised to learn just how much the sausage they have consumed their entire lives derives its unique taste from bureaucratic substances: paper, digital records, computer systems, change processes, committee meetings, salary schedules, human resource offices, and other administrative necessities.     

Let's not get sidetracked with that yet, though.  My point is, I had redesigned CIS110 before, but this time was different.

Because this time... y'know... I decided to use AI.