import React from 'react'

function Contact() {
  function ContactCard({ icon, title, content, link }) {

  const isEmail = link.includes('@');
  const isPhone = link.startsWith('+');

  let formattedLink = link;
  if (isEmail) {
    formattedLink = `mailto:${link}`;
  } else if (isPhone) {
    formattedLink = `tel:${link}`;
  } else {
    formattedLink = link; 
  }
    return (
      <div className='contact-card w-[300px] border-solid border-[2px] border-gray-200 p-4 rounded-md '>
        <img src={icon} alt={title} className='icon w-6' />
        <h3>{title}</h3>
        <p>{content}</p>
        <a href={formattedLink} className='contact-link no-underline text-[#7C3AED]'>{link}</a>
      </div>
    )
}
  return (
    <>
      <div className='text-center'>
        <h1>Contact Us</h1>
        <p>Have questions about BlockTix? Our team is here to help. Reach out to us using any of the methods below.</p>
        
        <div className='flex flex-wrap flex-col md:flex-row flex-1 justify-center items-center gap-4 m-8'>
        <ContactCard
          icon='https://www.svgrepo.com/show/502647/email-open.svg'
          title='Email Us'
          content='For general inquiries, please email us at support@blocktix.com.'
          link='support@blocktix.com'
        />

        <ContactCard
          icon='https://www.svgrepo.com/show/524804/phone-rounded.svg'
          title='Call Us'
          content='For immediate assistance, please call us at (123) 456-7890.'
          link='11234567890'
        />
        <ContactCard
          icon='https://www.svgrepo.com/show/502698/help-question.svg'
          title='Help Center'
          content='Check out our Help Center for FAQs and support articles.'
          link='help'
        />
     

        </div>

      </div>

    </>
  )
}

export default Contact;