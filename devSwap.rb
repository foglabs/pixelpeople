if `ls public|grep dev-index`.strip == "dev-index.html"

	puts "Switching to dev mode"
  `mv public/index.html public/prod-index.html`
  `mv public/dev-index.html public/index.html`
else
	puts "Switching to prod mode"
  `mv public/index.html public/dev-index.html`
  `mv public/prod-index.html public/index.html`
end 
