task :build do
  # check if node is available
  which "node" or fail "node could not be found in your $PATH."
  
  # create build with r.js using the build.js config
  sh "node vendor/r.js -o build.js"
end


####################
## Helpers #########
####################

def which(cmd)
  exts = ENV['PATHEXT'] ? ENV['PATHEXT'].split(';') : ['']
  ENV['PATH'].split(File::PATH_SEPARATOR).each do |path|
    exts.each do |ext|
      exe = "#{path}/#{cmd}#{ext}"
      return exe if File.executable? exe
    end
  end
  return nil
end
